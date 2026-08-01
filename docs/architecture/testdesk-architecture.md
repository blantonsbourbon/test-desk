# Test Desk Architecture

This document describes the current `v0.3.0` architecture and the seams present
in the implemented in-memory simulation. Forward-looking instructions live
only in the accepted target architecture and roadmap linked below.

> Current-state record: the implemented model below still uses the earlier
> simulation vocabulary. It is not the target implementation specification.
> The accepted target is documented in
> [Application Runs and Jenkins result ingestion](jenkins-test-results.md), and
> its migration order is defined in [the roadmap](../roadmap.md).

## Design principles

- `CatalogEntry` is the generic selection unit; `Scenario` is only a BDD definition kind.
- Test meaning (`TestType`/`DefinitionKind`) is independent from dispatch (`ExecutionConnector`).
- The client selects entries and an environment. The server resolves the `ExecutionProfile`, connector, command, job, and credentials.
- A Catalog Revision is immutable and every execution is pinned to one revision.
- Within the v0.3 contract, adapters sit at explicit seams so adding a framework
  or connector does not leak infrastructure choices into the request.
- The `ExecutionOrchestrator` is the deep application module: callers learn a small interface while polling, state mapping, cancellation, and result normalization remain inside it.

## 1. System context and ownership

```mermaid
flowchart TB
    UI["Angular console<br/>discover, select, run, observe"]
    REST["REST clients<br/>same entryIds contract"]
    FUTURE["Future origins<br/>schedule / webhook"]

    subgraph TD["Test Desk"]
        CATALOG_API["Catalog read module<br/>CatalogController"]
        CATALOG_APP["Catalog module<br/>CatalogService"]
        EXEC_API["Execution API<br/>ExecutionController"]
        EXEC_APP["Execution application module<br/>ExecutionService"]
        PROFILE["Profile registry<br/>ExecutionProfileRegistry"]
        ORCH["Deep module<br/>ExecutionOrchestrator"]
        STATE["Current state<br/>in-memory executions + latest entry results"]
    end

    subgraph CATALOG_SEAM["Catalog adapter seam"]
        ADAPTER["CatalogDefinitionAdapter"]
        BDD["BddSimulationCatalogAdapter<br/>implemented"]
        FUTURE_CATALOG["Git / Cucumber / Postman / JUnit adapters<br/>future"]
    end

    subgraph CONNECTOR_SEAM["Execution connector seam"]
        CONNECTOR["ExecutionConnector"]
        SIM["SimulationExecutionConnector<br/>implemented"]
        ANSIBLE["Ansible connector<br/>future"]
        JENKINS["Jenkins connector<br/>future"]
    end

    SOURCE["Test Source<br/>Git repository + Catalog Revision"]
    EXTERNAL["External execution systems<br/>Ansible / Jenkins / other"]

    UI --> CATALOG_API
    UI --> EXEC_API
    REST --> CATALOG_API
    REST --> EXEC_API
    FUTURE --> EXEC_API

    CATALOG_API --> CATALOG_APP
    CATALOG_APP --> ADAPTER
    SOURCE --> ADAPTER
    ADAPTER --> BDD
    ADAPTER -. future adapters .-> FUTURE_CATALOG
    CATALOG_APP --> STATE

    EXEC_API --> EXEC_APP
    EXEC_APP --> CATALOG_APP
    EXEC_APP --> PROFILE
    PROFILE --> ORCH
    ORCH --> CONNECTOR
    CONNECTOR --> SIM
    CONNECTOR -. future adapters .-> ANSIBLE
    CONNECTOR -. future adapters .-> JENKINS
    SIM --> EXTERNAL
    ANSIBLE -.-> EXTERNAL
    JENKINS -.-> EXTERNAL
    ORCH --> STATE
    STATE --> CATALOG_APP
```

### Ownership rules

| Data or decision | Owner | Client-visible? |
|---|---|---|
| Test definition metadata | Test Source and its `CatalogDefinitionAdapter` | Read-only through Catalog APIs |
| Catalog Revision | Catalog module | Yes; required for reproducible execution |
| Entry compatibility | `ExecutionProfileRegistry` | No; exposed only as resolved `profileId` |
| Connector, command, job, credentials | Server configuration and connector implementation | Never accepted from the request |
| External run reference | `ExecutionConnector` + `ExecutionOrchestrator` | Yes, as an opaque reference/URL |
| Result status and case values | `TestExecution` normalized result model | Yes |
| Request channel | `ExecutionOrigin` | Yes, as audit metadata |

## 2. Catalog module and adapter seam

```mermaid
flowchart LR
    REV["TestSource + immutable CatalogRevision"]
    LOAD["CatalogDefinitionAdapter.load(source, revision)"]
    GROUP["List<TestGroup>"]
    ENTRY["CatalogEntry\nid / sourceId / groupId\ntestType / framework\ndefinitionKind / selectionRef"]
    DETAILS["CatalogEntryDetails\ntype-specific, read-only"]
    BDD_DETAILS["BddCatalogEntryDetails\nsteps + examples"]
    GENERIC_DETAILS["GenericCatalogEntryDetails\ndescription"]
    READ["CatalogService\nfilter, sync, latest status"]
    API["Catalog REST response\ngroups + entries + stats"]

    REV --> LOAD --> GROUP --> ENTRY
    ENTRY --> DETAILS
    DETAILS --> BDD_DETAILS
    DETAILS --> GENERIC_DETAILS
    GROUP --> READ --> API
```

### Catalog interface and invariants

| Interface | Required behaviour | Current adapter |
|---|---|---|
| `CatalogDefinitionAdapter.id()` | Stable server-side adapter identity | `bdd-simulation` |
| `CatalogDefinitionAdapter.load(source, revision)` | Return immutable groups and entries for exactly one revision | Four BDD groups, nine entries |
| `CatalogEntry.selectionRef` | Opaque and revision-relative; connectors must not infer framework syntax | `features/...feature:line` simulation value |
| `CatalogEntryDetails` | Keep framework-specific data out of the generic entry | BDD details or generic description |
| `CatalogService.requestSync` | Replace catalog and revision as one logical update | Simulated delayed reload |

Within v0.3, adding a framework requires a new adapter, details type, profile
configuration, and contract tests. The target Application Run migration
deliberately replaces this frontend and execution request shape.

## 3. Execution module and connector seam

```mermaid
flowchart LR
    REQUEST["CreateExecutionRequest\nsourceId + entryIds + environment\nrevisionCommit + origin"]
    SERVICE["ExecutionService\nvalidate source, revision, entries"]
    REGISTRY["ExecutionProfileRegistry\nresolve one compatible profile"]
    EXECUTION["TestExecution\nqueued state + initial results"]
    ORCH["ExecutionOrchestrator\nsubmit / poll / map / cancel"]
    COMMAND["DispatchCommand\nrevision + environment + opaque refs"]
    CONNECTOR["ExecutionConnector seam"]
    EXTERNAL["ExternalExecution\nopaque reference + optional URL"]
    SNAPSHOT["ConnectorSnapshot\nqueued/running/terminal + updates"]
    RESULT["ExecutionEntryResult\naggregate or case-level"]
    CATALOG_STATUS["CatalogService.recordExecution\nlatest status per entry"]

    REQUEST --> SERVICE --> REGISTRY --> EXECUTION
    EXECUTION --> ORCH
    ORCH --> COMMAND --> CONNECTOR
    CONNECTOR --> EXTERNAL
    CONNECTOR --> SNAPSHOT
    SNAPSHOT --> ORCH
    ORCH --> RESULT
    RESULT --> CATALOG_STATUS
```

### Execution interface and invariants

| Module/seam | Interface | Invariants |
|---|---|---|
| `ExecutionService` | `create`, `list`, `get`, `cancel` | Rejects missing environment, stale revision, unknown entries, cross-source entries, and unsupported profiles before dispatch |
| `ExecutionProfileRegistry` | `resolve(entries, environment)`, `get(profileId)` | One profile must support every selected entry and the chosen environment |
| `ExecutionOrchestrator` | `start(execution, callback)`, `cancel(execution, callback)` | Connector details stay hidden; terminal executions are not mutated by later polls |
| `ExecutionConnector` | `id`, `submit`, `inspect`, `cancel` | `inspect` is repeatable; `submit` returns an opaque external reference; credentials remain server-side |
| `TestExecution` | `markRunning`, `complete`, `markRunnerError`, `cancel` | Lifecycle transitions and aggregate status are normalized in one place |

The current implementation schedules `inspect` every 150 ms against the
simulation connector. The accepted target moves coordination, external
references, observations, and normalized result artifacts to durable storage
through the explicit API migration in the roadmap.

## 4. Request-to-result sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as Angular / REST client
    participant API as ExecutionController
    participant App as ExecutionService
    participant Catalog as CatalogService
    participant Profiles as ExecutionProfileRegistry
    participant Orchestrator as ExecutionOrchestrator
    participant Connector as ExecutionConnector
    participant Store as Execution + result state

    User->>UI: Select entryIds + environment
    UI->>API: POST /api/v1/executions
    API->>App: create(request)
    App->>Catalog: validate source, revision, entries
    Catalog-->>App: immutable CatalogEntry values
    App->>Profiles: resolve(entries, environment)
    Profiles-->>App: server-managed ExecutionProfile
    App->>Store: create QUEUED TestExecution
    App->>Orchestrator: start(execution)
    Orchestrator->>Connector: submit(DispatchCommand)
    Connector-->>Orchestrator: ExternalExecution(reference)
    Orchestrator->>Store: attach external reference
    API-->>UI: 201 QUEUED + profileId + reference + initial results

    loop scheduled observation
        Orchestrator->>Connector: inspect(command, externalExecution)
        Connector-->>Orchestrator: ConnectorSnapshot
        alt RUNNING
            Orchestrator->>Store: markRunning + result status RUNNING
        else terminal
            Orchestrator->>Store: complete(normalized updates)
            Orchestrator->>Catalog: record latest entry result
        else connector error
            Orchestrator->>Store: markRunnerError(ERROR)
        end
    end

    UI->>API: GET /api/v1/executions/{id}
    API-->>UI: common execution + entry/case results
```

## 5. Lifecycle and result semantics

```mermaid
stateDiagram-v2
    [*] --> QUEUED: create
    QUEUED --> RUNNING: connector observes running
    QUEUED --> ERROR: submit/observation failure
    QUEUED --> CANCELLED: user cancel
    RUNNING --> PASSED: all reliable results pass
    RUNNING --> FAILED: reliable assertion failure
    RUNNING --> ERROR: no reliable result / infrastructure failure
    RUNNING --> CANCELLED: user cancel
    PASSED --> [*]
    FAILED --> [*]
    ERROR --> [*]
    CANCELLED --> [*]
```

| Result status | Meaning | Catalog effect |
|---|---|---|
| `PASSED` | Reliable result with no failed assertion | Latest entry status becomes passed |
| `FAILED` | Reliable test assertion failed | Latest entry status becomes failed |
| `ERROR` | Dispatch, infrastructure, observation, or parsing failed | Execution exposes actionable error information |
| `CANCELLED` | Explicit user cancellation | Results are marked cancelled |
| `SKIPPED` | Connector reports a skipped child result | Connector contract decides aggregate policy |

In v0.3, Scenario Outlines expand to one result per Example and plain entries
receive one aggregate result. The target Result Entry contract supersedes this
run-local representation.

## 6. Extension checklist

### New catalog adapter

1. Add an implementation of `CatalogDefinitionAdapter`.
2. Define stable entry IDs and opaque revision-relative `selectionRef` values.
3. Add a typed `CatalogEntryDetails` implementation when the framework has structured data.
4. Add an `ExecutionProfile` for supported environments and connector IDs.
5. Add adapter and profile contract tests.

### New execution connector

1. Implement `ExecutionConnector` behind the existing seam.
2. Translate `DispatchCommand` into allow-listed, server-configured external parameters.
3. Return an opaque `ExternalExecution` reference from `submit`.
4. Make `inspect` repeatable and map every external state to the common snapshot/result model.
5. Define cancellation, timeout, missing-result, duplicate-submit, and restart behaviour.
6. Add connector contract tests for queued, running, passed, failed, error, cancelled, and missing-result cases.
