# Target extension points for catalog, execution, and comparison

This contributor guide describes the accepted target seams. The current
`v0.3.0` code still uses the earlier simulation vocabulary; migration order is
defined in [the roadmap](../roadmap.md).

## Independent concerns

| Concern | Target seam | Examples |
|---|---|---|
| Result family | `TestType` | UI, Integration, Regression |
| Optional authoring/presentation form | `DefinitionStyle` | BDD |
| Framework/report interpretation | Catalog and result adapters | Playwright, Rest Assured, Cucumber, JUnit |
| Dispatch and observation | `ExecutionConnector` | Jenkins, simulation |
| Request source | `ExecutionOrigin` | UI, REST API, schedule, webhook |
| Derived comparison | `RegressionPolicy` and comparator | pinned candidate/Baseline comparison |

An `ExecutionProfile` is the server-owned compatibility mapping between a Test
Suite, Environment, framework, and connector configuration. Clients never
select a connector, command, job, or credential.

## Catalog flow

```text
Test Source + Catalog Revision
        |
        v
CatalogDefinitionAdapter.load(...)
        |
        v
Test Suite -> Catalog Entry -> framework/type-specific details
```

`CatalogEntry.selectionRef` is opaque and revision-relative. BDD steps are
optional typed details under Definition Style; they do not create another Test
Type.

UI and Integration suites contain executable Catalog Entries. A Regression
Policy selects candidate Source Test Runs and a Baseline comparison scope; it
is not disguised as a directly executable browser/API definition.

## Application Run flow

```text
Application Run request
        |
        v
ApplicationRunCoordinator
        |
        +--> resolve/pin Baseline
        |
        +--> UI Source Test Runs --------> ExecutionConnector
        |
        +--> Integration Source Test Runs -> ExecutionConnector
        |
        `--> Regression Test Run <-------- normalized candidate results
```

The coordinator owns partial dispatch, child attempts, Baseline pinning, and
the dependency that Regression waits for its configured Source Test Runs.

## State and result rules

- Execution Lifecycle is `QUEUED | RUNNING | COLLECTING | COMPLETED |
  CANCELLED`.
- Test Outcome is `PASSED | FAILED | UNKNOWN`.
- Ingestion State is `PENDING | VALID | PARTIAL | ERROR`.
- Jenkins native status remains External Execution metadata.
- Result Entry status is `PASSED | FAILED | SKIPPED`.
- A trustworthy assertion failure sets Outcome to `FAILED`.
- Missing or invalid required output keeps Outcome `UNKNOWN` and sets
  Ingestion to `PARTIAL` or `ERROR`.
- A Regression Outcome is determined by versioned blocking-delta rules only
  when all required comparison input is valid.

## Adding a catalog/framework adapter

1. Implement `CatalogDefinitionAdapter`.
2. Return immutable suites and entries for exactly one Catalog Revision.
3. Assign `UI` or `INTEGRATION`; assign BDD only as optional Definition Style.
4. Put framework-specific details outside the generic entry.
5. Use an opaque revision-relative `selectionRef`.
6. Define a stable cross-revision Result Identity namespace.
7. Add contract fixtures for identity, revision, selection, and parameter keys.

## Adding an Execution Connector

1. Implement submit, inspect, and cancel behind the connector seam.
2. Translate only server-managed profiles into external parameters.
3. Use Application Run ID, Test Run ID, and attempt as correlation/idempotency
   values.
4. Persist queue and build identity as an optional External Execution.
5. Keep observation repeatable across restart and duplicate notifications.
6. Deliver the authenticated terminal artifact namespace to the Result
   Ingestor; do not parse console text into outcomes.
7. Add connector contract fixtures for queue, run, timeout, cancellation,
   restart, partial dispatch, and duplicate submission.

## Adding a source-result adapter

1. Validate the common Result Manifest before framework parsing.
2. Parse only declared, hash-verified reports.
3. Produce normalized Result Entries with stable Result Identities.
4. Associate only sanitized Evidence with user-visible metadata.
5. Return an explicit Ingestion assessment independently from Test Outcome.
6. Cover valid, partial, malformed, missing, mismatched, and oversized input.

## Changing Regression comparison

Regression behavior is versioned through `RegressionPolicy`, not hidden in the
UI or Jenkins job. A change to identity matching, Compatibility Fingerprint,
Baseline resolution, comparison categories, or blocking rules requires
deterministic fixtures and a recorded policy version.

The comparator accepts normalized candidate Source Test Runs plus an immutable
Baseline. It never reads Jenkins console text or matches by display name.
