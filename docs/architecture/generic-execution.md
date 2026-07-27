# Generic catalog and execution extension points

This document is the contributor guide for adding a test framework, test type, or execution system without changing the public execution flow.

## The four independent concerns

| Concern | Current seam | Example |
|---|---|---|
| Definition meaning | `TestType` and `DefinitionKind` | BDD / API / Integration |
| Framework-specific catalog reading | `CatalogDefinitionAdapter` | Cucumber, Playwright, Postman, JUnit |
| Dispatch and observation | `ExecutionConnector` | Ansible, Jenkins, simulation |
| Request source | `ExecutionOrigin` | UI, REST API, schedule, webhook |

An `ExecutionProfile` is the server-owned compatibility mapping between a catalog entry, environment, and connector. The client selects entries and an environment; it never selects a connector, command, job, or credential.

## Catalog flow

```text
Test Source + Catalog Revision
        |
        v
CatalogDefinitionAdapter.load(...)
        |
        v
TestGroup -> CatalogEntry -> type-specific details
```

`CatalogEntry` is the generic selection unit. Its `selectionRef` is opaque and revision-relative, so a connector does not need to understand how a framework locates a definition in Git.

BDD steps and Examples live in `BddCatalogEntryDetails`. New test types should add their own details object rather than adding nullable fields to `CatalogEntry`.

## Execution flow

```text
Execution request
        |
        v
ExecutionService validates source/revision/entries
        |
        v
ExecutionProfileRegistry resolves one profile
        |
        v
ExecutionOrchestrator
        |
        v
ExecutionConnector.submit / inspect / cancel
        |
        v
ExecutionEntryResult + optional case results
```

The orchestrator is the application-facing module. Controllers and catalog code should not know connector details.

## Result rules

- `FAILED` means the test ran and produced a reliable failed assertion.
- `ERROR` means dispatch, infrastructure, observation, or result parsing could not produce a reliable test result.
- `CANCELLED` means the execution was explicitly cancelled.
- An execution can expose one aggregate result per entry or child case results when the framework publishes them.
- Preserve external references and raw result artifacts in the durable implementation; the common result model is for querying and UI display.

## Adding an adapter

### New catalog/framework adapter

1. Implement `CatalogDefinitionAdapter`.
2. Return immutable `TestGroup` and `CatalogEntry` values for one `CatalogRevision`.
3. Put framework-specific data in a `CatalogEntryDetails` implementation.
4. Use an opaque, revision-relative `selectionRef`.
5. Add adapter contract tests for identity, revision handling, and stable entry IDs.

### New execution connector

1. Implement `ExecutionConnector`.
2. Map `DispatchCommand` to the external system using server-managed configuration.
3. Return an opaque `ExternalExecution` reference from `submit`.
4. Make `inspect` repeatable and map external states into the common lifecycle/result model.
5. Implement cancellation and idempotency behavior explicitly.
6. Add connector contract tests using the simulation connector as the deterministic reference.

The first proving slice intentionally has only the BDD simulation adapter/profile. Adding an API adapter and a Jenkins profile is the next proof that test meaning and dispatch remain independent.
