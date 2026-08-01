# Target architecture: Jenkins test-result ingestion

This document describes the target architecture for displaying UI,
Integration, and Regression results produced through Jenkins. It is a design
artifact, not a description of the current implementation.

The classification and status semantics are governed by
[ADR-0004](../adr/0004-use-three-test-types-and-normalize-jenkins-output.md).

## Context and boundaries

Test Desk owns application/test metadata, execution intent, normalized result
history, evidence metadata, authorization, and the product experience. Jenkins
owns queueing and build execution. Git remains the source of test definitions,
and durable artifact storage owns large reports and evidence.

The public request identifies the Application, Test Type or selected suites,
environment, and pinned source revision. It never accepts Jenkins credentials,
arbitrary job names, scripts, or unrestricted parameters.

```mermaid
flowchart LR
    USER["User / API client"]

    subgraph TD["Test Desk"]
        API["Execution API"]
        ORCH["Execution Orchestrator"]
        PROFILE["Server-managed profiles"]
        JCON["Jenkins connector"]
        INGEST["Result ingestor"]
        ADAPTERS["Type adapters<br/>UI · Integration · Regression"]
        RESULTS[("Result store")]
        EVIDENCE[("Evidence metadata")]
        BASELINE["Baseline resolver"]
    end

    GIT["Git test source"]
    JENKINS["Jenkins controller / agents"]
    ARTIFACTS[("Artifact storage")]

    USER --> API --> ORCH
    ORCH --> PROFILE --> JCON
    JCON --> JENKINS
    JENKINS --> GIT
    JENKINS --> ARTIFACTS
    JCON --> INGEST
    ARTIFACTS --> INGEST
    INGEST --> ADAPTERS --> RESULTS
    INGEST --> EVIDENCE
    BASELINE --> ADAPTERS
    RESULTS --> BASELINE
    RESULTS --> API --> USER
```

## Domain model

```mermaid
erDiagram
    APPLICATION ||--o{ TEST_SUITE : owns
    TEST_SUITE ||--o{ TEST_RUN : executes
    TEST_RUN ||--o{ RESULT_ENTRY : contains
    RESULT_ENTRY ||--o{ EVIDENCE : references
    TEST_RUN o|--o| BASELINE_REFERENCE : compares_against
    TEST_RUN ||--|| EXTERNAL_EXECUTION : dispatched_as

    APPLICATION {
      string id
      string name
    }
    TEST_SUITE {
      string id
      enum testType
      string framework
      string definitionStyle
    }
    TEST_RUN {
      string id
      enum testType
      enum status
      string environment
      string revision
      datetime startedAt
      datetime finishedAt
    }
    RESULT_ENTRY {
      string stableId
      string parentId
      enum status
      int durationMs
      string message
    }
    EVIDENCE {
      string kind
      string objectKey
      string mediaType
      string redactionState
    }
    EXTERNAL_EXECUTION {
      string queueId
      string buildId
      string url
      string nativeStatus
    }
    BASELINE_REFERENCE {
      string runId
      string revision
      string policy
    }
```

`testType` is one of `UI`, `INTEGRATION`, or `REGRESSION`.
`definitionStyle` may contain `BDD` but does not influence dispatch or the
normalized result contract.

## Execution and ingestion sequence

```mermaid
sequenceDiagram
    actor User
    participant API as Test Desk API
    participant Orch as Orchestrator
    participant JC as Jenkins connector
    participant J as Jenkins
    participant A as Artifact storage
    participant I as Result ingestor
    participant DB as Result store

    User->>API: Run application/type at revision
    API->>Orch: create execution
    Orch->>JC: submit(profile, executionId, revision, environment)
    JC->>J: trigger allow-listed job
    J-->>JC: queue item ID
    JC-->>Orch: external reference
    API-->>User: Queued + Test Desk execution ID

    loop observe queue/build
        JC->>J: inspect queue/build
        J-->>JC: native state and build ID
        JC-->>Orch: normalized lifecycle observation
    end

    J->>A: publish manifest, reports, evidence
    JC->>I: collect terminal build artifacts
    I->>A: fetch and verify declared artifacts
    I->>I: validate manifest and adapt by Test Type
    I->>DB: persist normalized results and evidence metadata
    I-->>Orch: Passed / Failed / Error
    User->>API: read execution
    API->>DB: load normalized result
    API-->>User: type-specific workspace model
```

Submission uses the Test Desk execution ID as an idempotency/correlation key.
Queue item ID and build ID are both persisted because Jenkins may spend
significant time queued before assigning a build.

## Versioned Result Manifest

Each Jenkins build publishes one manifest per Test Run. A single umbrella
pipeline may produce three manifests, but Test Desk ingests them as distinct
typed runs.

Illustrative shape:

```json
{
  "schemaVersion": "1.0",
  "executionId": "exec_01J...",
  "applicationId": "checkout-web",
  "testType": "INTEGRATION",
  "environment": "qa",
  "revision": "a13f9c2",
  "framework": "rest-assured-junit5",
  "reports": [
    {
      "format": "junit-xml",
      "path": "reports/integration/results.xml",
      "sha256": "..."
    }
  ],
  "evidence": [
    {
      "kind": "sanitized-http-exchange",
      "path": "evidence/payments-authorize.json",
      "resultId": "payments-authorize"
    }
  ]
}
```

Required ingestion checks:

- schema version is supported;
- execution, application, type, environment, and revision match the dispatch;
- every declared path stays within the build artifact namespace;
- hashes match when supplied;
- report and evidence sizes remain within configured limits;
- stable result IDs are unique within the run;
- evidence is redacted or quarantined before user access.

Validation failure produces `Error`, not `Failed`.

## Type adapters

The ingestor delegates format-specific parsing to adapters behind a common
interface:

```text
normalize(manifest, reportFiles, baseline?) -> NormalizedTestRun
```

### UI adapter

Maps suites, browser journeys, and ordered steps. Screenshots, Playwright
traces, videos, console output, and network captures are linked to the
smallest applicable result entry. A missing screenshot does not invalidate an
otherwise valid report unless the profile declares it required.

### Integration adapter

Maps suites and cases from JUnit XML or another configured report. Sanitized
HTTP exchanges and contract diffs are evidence, not opaque message strings.
Transport errors remain assertion failures only when the runner produced a
valid test case result; missing infrastructure produces `Error`.

### Regression adapter

Resolves a pinned baseline before execution or comparison, matches entries by
stable identity, and emits:

- new failure;
- persistent failure;
- fixed;
- unchanged;
- unexecuted/missing.

The resolved baseline run ID, revision, and selection policy are persisted.
Display names are not used as identity.

## Storage and retention

- Relational result storage holds execution metadata, normalized entries,
  counts, comparison categories, and evidence metadata.
- Object storage holds reports, screenshots, traces, videos, sanitized HTTP
  exchanges, and large diffs.
- Jenkins URLs are retained as external references, not as the only path to
  evidence.
- Retention policies may differ by evidence kind and environment.
- Deleting an artifact leaves an auditable tombstone so the result does not
  silently appear incomplete.

## Reliability and reconciliation

- Submission is idempotent for one Test Desk execution ID.
- Observation is repeatable and safe after a Test Desk restart.
- Webhooks may accelerate updates, but polling remains the reconciliation
  fallback.
- A terminal normalized result is immutable; a corrected report creates a new
  ingestion revision or rerun rather than rewriting history silently.
- Timeout before a reliable report produces `Error`.
- Cancellation records both the requested action and the observed Jenkins
  outcome.

## Security

- Jenkins credentials and job mapping live in server-managed profiles.
- Job and parameter values are allow-listed.
- Artifact paths are normalized and cannot escape the build namespace.
- Evidence access is authorized against Application and Environment.
- HTTP captures, logs, and reports pass through configurable redaction.
- User-facing runner output is bounded and sanitized.
- Audit events cover trigger, cancellation, baseline selection, ingestion
  validation failure, evidence access, and retention deletion.

## Delivery boundary

This architecture deliberately leaves implementation for later slices:

1. Result Manifest schema and fixture validation.
2. Durable execution/external-reference persistence.
3. Jenkins connector submission and reconciliation.
4. One end-to-end adapter per Test Type.
5. Artifact storage, authorization, redaction, and retention.
6. Regression baseline policy and comparison service.
