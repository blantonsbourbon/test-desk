# Git-first test definitions and execution provenance

## Problem Statement

Test Desk currently has an in-memory simulation model whose source and
execution concepts are expressed through the earlier `Catalog*` vocabulary.
The intended product workflow is different: each Application owns tests in a
Git repository, a versioned YAML manifest describes the test semantics, and
Test Desk indexes that source for selection and execution without becoming a
test authoring system.

The first durable implementation must also answer a production-incident
question reliably: “Which tests ran against the exact application version that
was deployed at that time?” Pinning only the test manifest commit is
insufficient. A run must retain both test-source provenance and application
release/deployment provenance, together with the exact resolved selection and
execution context.

## Solution

Build a Git-first test platform with four explicit responsibilities:

1. Synchronize and validate one Application's YAML Test Manifest from Git at an
   immutable Test Source Revision.
2. Project the manifest into persistent `Test Suite`, `Test Case`, and `Test
   Case Revision` records. These are read-only projections of Git; there is no
   separate Catalog domain or manual case editor in the first version.
3. Create revision-pinned Application Runs that resolve a selection of Test
   Cases and retain an immutable Run Snapshot, including the tested
   Application Release, target Environment/Deployment, Test Source Revision,
   runner context, and execution policies.
4. Persist independently observable Test Runs, normalized Result Entries,
   Evidence/Artifacts, External Executions, and append-only Audit Events so a
   result can be diagnosed and reconstructed after a production incident.

The target relationship is:

```text
Application
  ├── Test Source (Git repository)
  │     └── Test Source Revision
  │           └── Test Manifest
  │                 └── Test Suite -> Test Case -> Test Case Revision
  ├── Application Release -> Deployment -> Environment
  └── Run Definition -> Application Run -> Test Run -> Result Entry / Artifact
```

The current `Catalog*` implementation remains migration evidence only. The
target API and persistence vocabulary uses `Test Suite`, `Test Case`, and `Test
Case Revision`.

## User Stories

1. As an Application owner, I want to register the Git repository containing
   my tests, so that Git remains the single source of truth.
2. As an Application owner, I want to configure the manifest path and default
   branch/ref, so that Test Desk knows where the test semantics are declared.
3. As a platform operator, I want to trigger a source synchronization, so that
   Test Desk can discover the latest committed test definitions.
4. As a platform operator, I want a synchronization to identify the exact Git
   commit, manifest hash, and parser version, so that the resulting projection
   is reproducible.
5. As a platform operator, I want an invalid manifest to fail as a whole and
   leave the last valid revision available, so that a bad commit cannot expose
   a partially parsed test tree.
6. As a platform operator, I want repeated synchronization of the same commit
   to be idempotent, so that webhook retries do not create duplicate suites or
   cases.
7. As a Test Engineer, I want to browse Test Suites and Test Cases from a
   synchronized revision, so that I can discover tests without editing them in
   Test Desk.
8. As a Test Engineer, I want to filter Test Suites and Test Cases by stable
   ID, name, path, tag, Test Type, framework, and status, so that I can select a
   focused run quickly.
9. As a Test Engineer, I want a Test Case to keep a stable identity across Git
   revisions, so that its result history can be compared even when its
   display name or implementation changes.
10. As a Test Engineer, I want a source revision to preserve the exact suite
    membership, case metadata, source path, entrypoint, parameters, and
    execution reference, so that old runs remain interpretable after later
    commits rename or remove tests.
11. As a Test Engineer, I want to define a reusable Run Definition using suite,
    case, tag, path, and Test Type selectors, so that I do not have to manually
    reselect cases for every run.
12. As a Test Engineer, I want to start an Application Run from an explicit
    Test Source Revision, so that a moving branch cannot change the tests while
    the run is being created or observed.
13. As a Test Engineer, I want to associate a run with an Application Release,
    build number, source commit, and artifact/image digest, so that the run can
    be correlated with a deployed application version.
14. As a Test Engineer, I want to associate a run with an Environment and,
    when available, a concrete Deployment, so that “tested in QA” is not
    confused with “tested against this deployment instance.”
15. As a Test Engineer, I want the system to save the resolved Test Case list
    and execution configuration at run creation, so that changes to the
    manifest or Run Definition cannot rewrite run history.
16. As a Test Engineer, I want to see Application Run coordination separately
    from Test Outcome, so that queued, cancelled, failed-to-dispatch, and
    assertion-failed states are not collapsed into one misleading status.
17. As a Test Engineer, I want UI and Integration Test Runs to use their
    configured Execution Connector while keeping connector details out of the
    test definition, so that source semantics remain independent from
    infrastructure.
18. As a Test Engineer, I want retries to create a new attempt while retaining
    the original attempt and result, so that a retry cannot erase evidence of
    the first failure.
19. As a Test Engineer, I want a result manifest to identify the Application,
    Test Type, Application Run, Test Run, Test Source Revision, tested release,
    environment, and declared result files, so that ingestion can verify that
    the output belongs to the run that claims it.
20. As a Test Engineer, I want malformed, missing, partial, or hash-mismatched
    output to have an explicit Ingestion State, so that invalid evidence does
    not become a false Passed or Failed outcome.
21. As a Test Engineer, I want Allure reports, raw reports, logs, screenshots,
    traces, videos, and other large outputs stored as managed S3 artifacts, so
    that the database remains queryable while diagnostic evidence remains
    available after external runner retention expires.
22. As a Test Engineer, I want normalized Result Entries to retain stable
    Application, Test Suite, Test Case, and parameter identity, so that results
    can be compared across source revisions.
23. As an Incident Responder, I want to search by production Deployment,
    Application Release, image digest, or release commit, so that I can find
    every Application Run that evaluated the affected version.
24. As an Incident Responder, I want the search to distinguish tests that were
    selected, dispatched, actually completed, skipped, failed to dispatch, or
    never run, so that “no result” is not mistaken for “passed.”
25. As an Incident Responder, I want each matched run to show the exact Test
    Source Revision and Run Snapshot, so that I can reconstruct what the team
    believed it was testing at the time.
26. As an Incident Responder, I want direct links to authorized raw and
    derived artifacts, so that I can inspect the original evidence without
    exposing unredacted runner data to unauthorized users.
27. As an Auditor, I want append-only events for source synchronization,
    release/deployment association, run creation, dispatch, retry,
    cancellation, result ingestion, artifact access, and retention actions, so
    that important changes are explainable.
28. As a Platform Operator, I want sync, execution, and ingestion to survive
    restart and duplicate delivery, so that a transient platform failure does
    not duplicate runs or lose terminal results.
29. As a Platform Operator, I want parser and manifest schema versions recorded,
    so that a later parser upgrade can be distinguished from a change in the
    Git source.
30. As a Product Engineer, I want one high-level source-to-run contract seam,
    so that adapters, persistence, and connectors can evolve without exposing
    infrastructure details through the UI contract.

## Implementation Decisions

### Domain terminology

- `Test Source` is the authoritative Git repository.
- `Test Manifest` is the YAML document that declares an Application's Test
  Suites and Test Cases.
- `Test Source Revision` is an immutable Git commit resolved by a source sync.
- `Test Suite` is an organizational and compatibility grouping of Test Cases;
  it is not a runtime execution.
- `Test Case` is a stable independently selectable test identity.
- `Test Case Revision` is the parsed immutable definition of a Test Case at one
  Test Source Revision.
- There is no target `Catalog` domain object and no manual Test Case editor in
  the first version. Existing `Catalog*` classes are treated as migration
  compatibility code.

### Manifest contract

The first manifest schema must contain a schema version and stable identifiers
for the Application, Test Suites, and Test Cases. A Test Case definition may
declare Test Type, optional Definition Style, Test Framework, tags, source path,
entrypoint/selection reference, parameters, and type-specific metadata.

The manifest must not be the source of runtime outcomes, audit events, secrets,
or generated large artifacts. Environment values that vary per execution belong
to Run Definitions or server-managed environment configuration; the manifest
may declare the semantic requirement or parameter name.

Stable keys are namespaced by Application and are the primary identity used for
sync, result correlation, and incident lookup. Display names and source line
numbers are not identities.

### Persistence model

Use a relational database with JSON/JSONB fields only for versioned,
type-specific payloads and snapshots. Large output remains in S3-compatible
object storage.

#### Application and source

- `application`: stable Application identity, name, ownership, and lifecycle.
- `test_source`: Application-owned Git repository, default ref, manifest path,
  adapter/schema identity, and sync status.
- `test_source_revision`: immutable Git commit, resolved ref, manifest hash,
  parser version, sync status, and optional source-manifest artifact pointer.
  Enforce uniqueness on `(test_source_id, commit_sha)`.

#### Test definitions

- `test_suite`: stable Suite identity, Application, stable key, current name,
  Test Type, Framework, optional parent Suite, and lifecycle.
- `test_suite_revision`: Suite metadata and membership identity at a specific
  Test Source Revision; this preserves historical names and grouping.
- `test_case`: stable Case identity, Application, stable key, and current
  summary metadata.
- `test_case_revision`: Case, Test Source Revision, Suite Revision, name,
  source path, selection reference, framework/style, tags, parameters,
  definition hash, and type-specific parsed definition JSON. Enforce uniqueness
  on `(test_case_id, test_source_revision_id)`.

No separate `test_definition` table is required in the first version;
`test_case_revision` is the immutable parsed definition.

#### Application version and deployment provenance

- `application_release`: immutable release/build identity, source commit,
  build number, artifact or image digest, and build metadata.
- `deployment`: immutable deployment event/version, Application Release,
  Environment, deployment reference, status, and active time window. Support
  rollback by recording a new deployment, never by rewriting the old one.
- `environment`: business-level target such as development, QA, staging, or
  production.

#### Selection and execution

- `run_definition`: reusable Application-owned selection and execution policy,
  including selectors, default environment, Test Type policy, connector
  profile, and retry/timeout behavior.
- `application_run`: one run request with pinned Application Release,
  optional concrete Deployment, Environment, Test Source Revision, Run
  Definition, trigger, lifecycle, provenance status, and timestamps.
- `application_run_case`: immutable Run Snapshot row for each resolved Test
  Case, including Case Revision, Suite Revision, selection reason/order, and a
  compact definition snapshot.
- `test_run`: independently observable typed child run under Application Run,
  with Lifecycle, Test Outcome, Ingestion State, Suite/Type context, and
  connector association.
- `test_run_attempt`: each dispatch/retry attempt, with idempotency key,
  external reference, attempt context, lifecycle, and terminal observation.
- `external_execution`: opaque connector queue/build/task reference, URL,
  connector metadata, and observation timestamps.

The `Application Run` must record both `test_source_revision_id` and
`application_release_id`. The latter is the key needed for production incident
forensics; the former explains which tests were used.

#### Results and evidence

- `result_manifest`: versioned, hash-verified ingestion envelope connected to a
  Test Run and attempt. It records declared result and evidence files,
  provenance, schema version, and ingestion assessment.
- `result_entry`: normalized Suite, Case, step, parameter, or comparison result
  with stable Result Identity, status, outcome, timing, concise message, and
  optional parent entry.
- `artifact`: metadata for an S3 object: owner run/result, kind, bucket/key,
  checksum, content type, byte size, redaction/authorization state, and
  retention timestamps. Allure is one artifact/report kind, not the only result
  source.
- `audit_event`: append-only actor/action/entity event with timestamp,
  correlation ID, and structured details. Audit does not replace Execution
  Provenance.

#### Relational schema details

The following is the first-version relational contract. The names are logical
table names; the physical migration may add tenant/organization columns later
without changing the ownership and immutability rules below.

Schema conventions:

- Use UUID primary keys generated by the application. Use `text` stable keys
  for Git-facing identities such as `suite_key` and `case_key`.
- Use UTC `timestamptz` for all times. Lifecycle/state changes are mutable
  coordination fields; source definitions, revision content, run snapshots,
  and result content are immutable after creation.
- Use `jsonb` only for manifest-specific details, execution configuration,
  provenance metadata, and immutable snapshots. Fields used for lookup or
  joins remain first-class columns.
- Prefer foreign keys over polymorphic references. The one exception is
  `audit_event.entity_type/entity_id`, whose purpose is cross-aggregate audit
  search rather than domain navigation.

##### Application and Git source tables

| Table | Important columns | Constraints and indexes |
|---|---|---|
| `application` | `id`, `app_key`, `name`, `description`, `status`, `created_at`, `updated_at` | `unique(app_key)`; all source, release, environment, and run data belongs to one Application |
| `test_source` | `id`, `application_id`, `provider`, `repository_url`, `default_ref`, `manifest_path`, `adapter_id`, `sync_status`, `active_revision_id`, `last_sync_at`, `last_sync_error` | First version: `unique(application_id)`; `provider = GIT`; index active source by Application |
| `test_source_sync` | `id`, `test_source_id`, `requested_ref`, `resolved_commit_sha`, `parser_version`, `status`, `error_code`, `error_message`, `started_at`, `finished_at` | index `(test_source_id, started_at desc)`; repeated attempts for one commit are allowed |
| `test_source_revision` | `id`, `test_source_id`, `commit_sha`, `resolved_ref`, `manifest_path`, `manifest_hash`, `manifest_schema_version`, `parser_version`, `status`, `manifest_uri`, `created_at` | `unique(test_source_id, commit_sha, parser_version)`; index `(test_source_id, created_at desc)`; failed revisions remain queryable |

`test_source_sync` records an attempt, while `test_source_revision` records a
parsed source snapshot. A retry of the same commit must not create duplicate
Suite/Case projections when the parser and manifest hashes are unchanged.

##### Test Suite and Test Case tables

| Table | Important columns | Constraints and indexes |
|---|---|---|
| `test_suite` | `id`, `application_id`, `suite_key`, `current_name`, `current_test_type`, `current_framework`, `parent_suite_id`, `status`, `created_at`, `updated_at` | `unique(application_id, suite_key)`; index `(application_id, status)` |
| `test_suite_revision` | `id`, `test_suite_id`, `test_source_revision_id`, `name`, `suite_path`, `test_type`, `framework`, `definition_style`, `tags`, `ordinal`, `definition_hash` | `unique(test_suite_id, test_source_revision_id)`; index `(test_source_revision_id, ordinal)` |
| `test_case` | `id`, `application_id`, `case_key`, `current_name`, `status`, `created_at`, `updated_at` | `unique(application_id, case_key)`; index `(application_id, status)` |
| `test_case_revision` | `id`, `test_case_id`, `test_source_revision_id`, `test_suite_revision_id`, `name`, `source_path`, `selection_ref`, `test_type`, `framework`, `definition_style`, `tags`, `parameters`, `definition`, `definition_hash`, `ordinal` | `unique(test_case_id, test_source_revision_id)`; index `(test_source_revision_id, test_suite_revision_id, ordinal)`; `definition` is immutable JSONB |

The stable `test_suite` and `test_case` rows support cross-revision history.
The revision rows preserve the exact name, grouping, source locator, metadata,
and parsed definition used at a particular Git commit. The first version treats
one Case as belonging to one Suite per source revision. A future many-to-many
requirement can introduce `test_case_suite_revision` without changing stable
Case identity.

##### Release, Deployment, and Environment tables

| Table | Important columns | Constraints and indexes |
|---|---|---|
| `environment` | `id`, `application_id`, `environment_key`, `name`, `kind`, `config_ref`, `status` | `unique(application_id, environment_key)`; never store environment secrets in this table |
| `application_release` | `id`, `application_id`, `release_key`, `build_number`, `source_commit_sha`, `artifact_digest`, `artifact_uri`, `metadata`, `created_at`, `released_at` | `unique(application_id, release_key)`; index `(application_id, artifact_digest)` and `(application_id, source_commit_sha)` |
| `deployment` | `id`, `application_id`, `application_release_id`, `environment_id`, `deployment_key`, `external_ref`, `status`, `deployed_at`, `ended_at`, `metadata` | index `(application_release_id, deployed_at desc)`, `(environment_id, deployed_at desc)`; rollback creates a new row |

`application_release` answers “which build/image was this?” and `deployment`
answers “where and when was that release present?”. A Deployment is never
rewritten to point at a new release.

##### Selection and execution tables

| Table | Important columns | Constraints and indexes |
|---|---|---|
| `run_definition` | `id`, `application_id`, `name`, `selector`, `execution_config`, `enabled`, `version`, `created_by`, `created_at`, `updated_at` | index `(application_id, enabled)`; `selector` and `execution_config` are mutable templates; connector is resolved server-side |
| `execution_profile` | `id`, `application_id`, `test_suite_id`, `environment_id`, `connector_id`, `platform`, `framework`, `runner_ref`, `connector_config_ref`, `enabled`, `version` | index `(test_suite_id, environment_id, platform, enabled)`; credentials and commands remain in server-managed configuration |
| `application_run` | `id`, `application_id`, `run_definition_id`, `test_source_revision_id`, `application_release_id`, `deployment_id`, `environment_id`, `trigger`, `provenance_status`, `lifecycle`, `requested_by`, `requested_at`, `started_at`, `finished_at`, `snapshot_hash`, `execution_config_snapshot`, `provenance_snapshot` | index `(application_id, requested_at desc)`, `(application_release_id, requested_at desc)`, `(deployment_id, requested_at desc)`, `(test_source_revision_id, requested_at desc)` |
| `application_run_case` | `id`, `application_run_id`, `test_case_id`, `test_case_revision_id`, `test_suite_revision_id`, `selection_key`, `selection_reason`, `selection_order`, `execution_state`, `definition_snapshot`, `created_at` | `unique(application_run_id, test_case_id, selection_key)`; index `(application_run_id, execution_state)` |
| `test_run` | `id`, `application_run_id`, `test_suite_id`, `test_type`, `lifecycle`, `outcome`, `ingestion_state`, `execution_profile_id`, `connector_id`, `created_at`, `started_at`, `finished_at` | index `(application_run_id, test_type)`, `(test_suite_id, created_at desc)` |
| `test_run_attempt` | `id`, `test_run_id`, `attempt_no`, `idempotency_key`, `external_execution_id`, `lifecycle`, `error_code`, `error_message`, `request_context`, `observed_at`, `started_at`, `finished_at` | `unique(test_run_id, attempt_no)`, `unique(idempotency_key)`; retry creates a new attempt |
| `external_execution` | `id`, `connector_id`, `external_kind`, `external_id`, `external_url`, `raw_state`, `metadata`, `created_at`, `last_observed_at` | `unique(connector_id, external_kind, external_id)` |

`application_run` is the forensic aggregate. It must retain
`test_source_revision_id` and `application_release_id`; `deployment_id` is
nullable only when the runner targets an environment without a concrete
deployment identity. `provenance_status` must make that incompleteness
visible rather than silently treating it as production coverage.

`application_run_case` is the Run Snapshot at row level. It lets incident
queries distinguish `SELECTED`, `DISPATCHED`, `COMPLETED`, `SKIPPED`,
`NOT_RUN`, and `DISPATCH_FAILED` even when no Result Entry exists.

#### Generic execution connector contract

An Execution Connector is an extension point for dispatching and observing an
external runner. Jenkins and Kubernetes are implementations, not domain types
and not values that clients pass directly in an execution request.

```text
ExecutionProfile
  -> ConnectorRegistry
       -> ExecutionConnector
            submit(ExecutionRequest)
            observe(ExternalExecution)
            cancel(ExternalExecution)
            collect(ExternalExecution)
```

The provider-neutral contract uses these concepts:

- `ExecutionRequest`: Application Run ID, Test Run ID, Attempt ID, Test Source
  Revision, Application Release/Deployment, Environment, resolved Test Suite
  selection, and server-managed profile context.
- `ExternalExecution`: opaque `connector_id`, provider reference, optional URL,
  external kind, and metadata. The core model must not know whether the
  reference is a Jenkins build number, Kubernetes Job UID, Argo workflow ID,
  or another provider handle.
- `ExecutionObservation`: normalized external lifecycle (`QUEUED`, `RUNNING`,
  `TERMINAL`), provider state, terminal reason, timestamps, and artifact
  descriptors. It does not set Test Outcome directly.
- `ArtifactDescriptor`: opaque source URI/reference, kind, checksum, content
  type, size, and optional upload URL. Result parsing belongs to the Result
  Ingestor, not to a connector.

Connector invariants:

- `submit` is idempotent by `test_run_attempt_id`/idempotency key; a timeout
  must be reconciled before another external execution is created.
- `observe` is repeatable and maps provider states to the common lifecycle;
  provider-native state remains metadata.
- `cancel` and `collect` are safe to call more than once.
- Connector credentials, commands, namespaces, jobs, pools, and runner images
  come from server-managed `ExecutionProfile` configuration.
- Every connector produces the same versioned Result Manifest and Artifact
  metadata contract.

The server resolves an `ExecutionProfile` from Test Suite, Environment,
Framework, Platform, and configured capabilities. The client selects tests and
environment; it does not select a connector or provider-specific settings.

Initial implementations:

- `KubernetesExecutionConnector` runs containerized workloads as a
  Kubernetes Job. Job name/UID, namespace, and Pod identity are stored in
  `external_execution`.
- `JenkinsExecutionConnector` dispatches a configured pipeline to a Windows
  Agent for suites that require Windows browsers or host-installed Playwright
  dependencies. Queue item/build references use the same
  `external_execution` table.

Future implementations such as GitHub Actions, Argo Workflows, AWS Batch,
Buildkite, or a local process runner must implement the same contract without
changing `ApplicationRun`, `TestRun`, `TestRunAttempt`, `ResultManifest`, or
`Artifact`.

The Windows Jenkins pipeline receives `applicationRunId`, `testRunId`,
`attemptId`, `testSourceRevision`, `applicationRelease`, and `environment` as
server-generated correlation context. It checks out the exact Test Source
Revision, runs the Test Suite, uploads the Result Manifest and artifacts, and
reports the terminal execution reference back to Test Desk. Jenkins console
status is connector metadata, not the Test Outcome.

Both initial connectors can coexist in one Application Run: Linux suites may
run as Kubernetes Jobs while Windows Playwright suites run on Jenkins Agents.

##### Results, artifacts, and audit tables

| Table | Important columns | Constraints and indexes |
|---|---|---|
| `result_manifest` | `id`, `test_run_attempt_id`, `manifest_version`, `generator`, `manifest_hash`, `source_artifact_id`, `validation_status`, `ingestion_state`, `declared_files`, `received_at`, `metadata` | index `(test_run_attempt_id, received_at desc)`; duplicate delivery is detected by hash and attempt |
| `result_entry` | `id`, `test_run_attempt_id`, `parent_entry_id`, `application_id`, `test_suite_id`, `test_case_id`, `suite_key_snapshot`, `case_key_snapshot`, `parameter_key`, `result_identity_hash`, `status`, `outcome`, `message`, `duration_ms`, `started_at`, `finished_at`, `details` | index `(test_run_attempt_id, parent_entry_id)`, `(application_id, case_key_snapshot, finished_at desc)`; identity uses Application + Suite + stable Case + parameter |
| `artifact` | `id`, `test_run_attempt_id`, `result_entry_id`, `kind`, `s3_uri`, `checksum`, `content_type`, `byte_size`, `redaction_state`, `retention_until`, `created_at` | index `(test_run_attempt_id, kind)`, `(retention_until)`; `kind` includes `RAW_OUTPUT`, `ALLURE_RESULTS`, `ALLURE_REPORT`, `LOG`, and `EVIDENCE` |
| `audit_event` | `id`, `application_id`, `entity_type`, `entity_id`, `action`, `actor_type`, `actor_id`, `correlation_id`, `details`, `occurred_at` | append-only; index `(application_id, occurred_at desc)`, `(entity_type, entity_id, occurred_at desc)` |

`result_entry` belongs to an attempt so that a retry cannot overwrite the
original evidence. The Test Run exposes the selected/canonical aggregate, but
all attempt-level results remain available for diagnosis.

#### Relationship summary

```text
application 1──1 test_source 1──N test_source_revision
application 1──N test_suite 1──N test_suite_revision
application 1──N test_case 1──N test_case_revision
test_suite_revision 1──N test_case_revision

application 1──N application_release 1──N deployment N──1 environment
run_definition 1──N application_run
application_run N──1 test_source_revision
application_run N──1 application_release
application_run N──1 deployment (optional)
application_run 1──N application_run_case
application_run 1──N test_run 1──N test_run_attempt
test_run_attempt 1──N result_manifest
test_run_attempt 1──N result_entry
test_run_attempt 1──N artifact
```

#### S3 artifact layout

The database stores metadata and immutable references; object keys are derived
from IDs, never mutable names or branches:

```text
applications/{applicationId}/runs/{applicationRunId}/
  test-runs/{testRunId}/attempts/{attemptId}/
    raw/{artifactId}/output.bin
    allure-results/{artifactId}/results.zip
    allure-report/{artifactId}/report.zip
    evidence/{artifactId}/attachment
```

The `ALLURE_RESULTS` artifact is the structured input to an Allure renderer;
`ALLURE_REPORT` is a derived HTML/static report. Both remain linked to the same
attempt and generator metadata. Allure is therefore easy to regenerate without
becoming the only source of truth.

#### Incident query shape

The primary incident query starts from immutable release/deployment identity:

```text
Deployment or image digest
  -> application_release
  -> application_run
  -> application_run_case / test_run
  -> result_entry / artifact / audit_event
```

The query must return runs grouped by provenance completeness and clearly
distinguish:

- selected but not dispatched;
- dispatched but no trustworthy output;
- skipped or cancelled;
- completed with Passed/Failed outcome;
- completed with partial or invalid ingestion.

This prevents a missing result from being interpreted as a passing test.

### Sync behavior

1. Resolve the configured Git ref to a commit.
2. Read and validate the manifest at that commit.
3. Parse the manifest into immutable Suite/Case revisions.
4. Persist the source revision and all projections transactionally.
5. Advance the source's active revision only after the complete projection is
   valid.
6. Keep failed revisions and sync errors observable without replacing the last
   valid active revision.
7. Preserve old revisions and stable identities; do not hard-delete data that
   an existing Application Run references.

The existing adapter seam remains the highest integration seam: a source
adapter loads one exact revision and returns framework-independent Suite/Case
values with type-specific details. Persistence replaces the current in-memory
maps behind that seam.

### Run and incident behavior

Creating an Application Run resolves selectors against one explicit Test Source
Revision and saves the resulting Run Snapshot. It must also resolve or require
an Application Release and Environment. A concrete Deployment is required when
the target is a known deployed instance; otherwise the run records a clear
provenance state such as `UNKNOWN` rather than implying production coverage.

Incident lookup first resolves the affected Deployment/Application Release,
then finds Application Runs by immutable release identity, and finally joins
Test Runs, Result Entries, and Artifacts. The result must show both “selected but
not run” and “ran with no trustworthy output” as distinct states.

### Result and artifact behavior

The common result envelope keeps Lifecycle, Test Outcome, and Ingestion State
independent. Result ingestion validates declared hashes and paths, creates a
versioned Result Manifest, normalizes Result Entries, and attaches sanitized
Evidence. Raw outputs and Allure reports may be rendered in the UI, but the
database remains the source for run identity, status, provenance, and artifact
metadata.

### API behavior

The target API must provide behavior equivalent to:

- register and inspect an Application's Git Test Source;
- request and inspect synchronization for a specific source revision;
- list Test Suites and Test Cases at a selected revision;
- create and inspect Run Definitions;
- create an Application Run with explicit source revision, release, environment,
  optional deployment, and selectors;
- inspect the immutable Run Snapshot and child Test Runs;
- list incident-oriented runs by release, image digest, deployment, source
  revision, environment, and time;
- retrieve authorized Artifact metadata and URLs;
- inspect Audit Events for the run and its provenance chain.

Clients must never choose credentials, arbitrary connector commands, or
unallowlisted external job parameters.

## Testing Decisions

Tests should verify externally observable contracts and persisted behavior, not
private parser or repository implementation details. The highest-value seam is
the source-to-run application boundary:

```text
Git fixture at commit
  -> manifest sync
  -> Suite/Case projection
  -> run selection and snapshot
  -> release/deployment provenance
  -> normalized result and artifact lookup
```

Test modules and fixtures:

- Manifest parser contract fixtures: valid schema, unsupported schema version,
  duplicate stable IDs, missing required fields, invalid Test Type, invalid
  source reference, changed suite membership, case deletion, and rename.
- Source synchronization integration tests: idempotent same-commit sync,
  atomic failed sync, active-revision advancement, concurrent sync requests,
  and old-revision lookup.
- Run creation integration tests: explicit revision pinning, selector
  resolution, immutable selection snapshot, release/deployment association,
  unknown provenance, stale ref rejection, and no cross-Application selection.
- Execution contract tests: queued/running/terminal transitions, retry as a
  new attempt, cancellation, duplicate notification, restart/reconciliation,
  partial dispatch, and connector error.
- Result ingestion tests: valid manifest, missing/malformed/partial output,
  hash mismatch, path traversal, oversized artifact, duplicate delivery, and
  Allure plus raw artifact retention.
- Incident query tests: find runs by release, image digest, deployment, and
  time; distinguish not selected, selected but not dispatched, skipped,
  failed, invalid output, and passed.
- API tests should extend the existing `TestDeskApiTest` style for end-to-end
  HTTP behavior and retain the existing `ExecutionProfileRegistryTest` style
  for profile compatibility rules.

## Out of Scope

- Manual Test Case creation or editing in the Test Desk UI.
- A separate Catalog domain/table or a second copy of Git as an editable source.
- Supporting arbitrary manifest schemas without a versioned adapter contract.
- Multi-repository aggregation for one Application in the first version.
- Test Desk's own deployment orchestration; it records releases and
  deployments supplied by CI/CD or deployment integration.
- Full Incident Management workflows, ticket creation, ownership, and
  postmortem authoring.
- Making Allure the sole source of truth for outcome or provenance.
- User-selected credentials, arbitrary commands, or unreviewed external runner
  configuration.
- Regression comparison implementation beyond preserving the existing target
  domain's source-run and baseline contracts.

## Further Notes

- PostgreSQL is the intended relational persistence target; JSONB is appropriate
  for type-specific manifest details and immutable snapshots, not for replacing
  queryable identity and lifecycle columns.
- S3 keys should be generated from immutable Application Run/Test Run IDs and
  artifact IDs, not from mutable test names or branch names.
- Every displayed historical result should be able to navigate to both the Test
  Source Revision and Application Release/Deployment provenance.
- If a CI system cannot provide an application release or deployment identity,
  the run may still be stored, but incident lookup must mark that provenance as
  incomplete instead of claiming exact version coverage.
- The current roadmap's `Application Run`, three Test Types, independent state
  axes, connector seam, normalized result manifest, and S3 Evidence model are
  retained and extended by this specification.
