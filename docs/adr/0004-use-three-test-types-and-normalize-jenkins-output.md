# ADR-0004: Use three Test Types and normalize Jenkins output

- Status: Accepted
- Date: 2026-08-01
- Supersedes: the `BDD | API | Integration` classification examples in ADR-0003
- Refined by: ADR-0005 for Application Run, Regression dependency, and state semantics

## Context

Test Desk needs to present automated test results from Jenkins without making
Jenkins console output the product experience. One application may own several
kinds of tests, and the result that matters to a user differs by kind:

- a browser journey is understood through steps and visual evidence;
- a service integration is understood through API exchanges and assertions;
- a regression run is understood by comparing a candidate report with a
  previously accepted baseline.

BDD does not describe a distinct execution or result shape. It is an authoring
and presentation style that may be used by tests in more than one category.
Similarly, Playwright, Rest Assured, Cucumber, and JUnit are frameworks rather
than Test Types.

Jenkins exposes queue/build states and logs, but those values alone cannot
reliably distinguish an assertion failure from missing or malformed test
output. Test Desk therefore needs its own stable vocabulary and result
contract.

## Decision

Test Desk adopts exactly three Test Types:

| Test Type | Meaning | Primary result experience |
|---|---|---|
| `UI` | A user journey executed through a browser or comparable user interface | Ordered steps, failed assertion, screenshot, trace, video, console/network evidence |
| `INTEGRATION` | A group of API or service-boundary checks, for example Rest Assured suites | Suite/case hierarchy, request and response summary, assertion or contract diff |
| `REGRESSION` | A candidate result set compared with an explicit accepted baseline | New failures, persistent failures, fixed cases, unchanged and unexecuted cases |

BDD is represented separately as an optional Definition Style. Framework is
also separate metadata. Neither changes the Test Type.

An Application may have zero or more UI/Integration suites and Regression
policies. Its overview groups all three Test Types under one Application Run,
but each type keeps its own Test Run identity, state, counts, duration, result
hierarchy, and evidence. UI and Integration Test Runs may reference Jenkins
builds; a derived Regression Test Run references its candidate Source Test
Runs and Baseline and therefore need not own a Jenkins build.

### Jenkins result contract

Every Jenkins job integrated with Test Desk must publish a versioned,
machine-readable Result Manifest. The manifest identifies the application,
Test Type, Test Desk execution ID, source revision, environment, framework,
result files, and evidence files. Format-specific adapters may read JUnit XML,
Playwright output, or a regression comparison report, but all adapters produce
the same connector-neutral model:

```text
TestRun
  id
  applicationRunId
  applicationId
  testType                 UI | INTEGRATION | REGRESSION
  environment
  revision
  lifecycle                QUEUED | RUNNING | COLLECTING | COMPLETED | CANCELLED
  outcome                  PASSED | FAILED | UNKNOWN
  ingestionState           PENDING | VALID | PARTIAL | ERROR
  externalExecution        optional Jenkins queue/build reference and URL
  startedAt / finishedAt / duration
  counts
  resultEntries[]
  evidence[]
  sourceRunIds             only when testType = REGRESSION
  baseline                 only when testType = REGRESSION
```

The normalized state has three independent axes:

- `Lifecycle` describes progress through queueing, execution, collection, and
  completion independently of outcome.
- `Outcome = Passed | Failed` is set only from trustworthy normalized results;
  otherwise it remains `Unknown`.
- `Ingestion State` distinguishes pending, valid, partial, and invalid output.
- `Skipped` remains a Result Entry status; it is not a top-level substitute for
  `Unknown` or `Ingestion State = Error`.

Jenkins console output remains a bounded, sanitized diagnostic escape hatch.
It is not parsed as the primary result protocol.

### Evidence and retention

Result records contain stable identities, statuses, timings, and concise
messages. Large evidence such as screenshots, traces, videos, request/response
captures, diffs, and raw reports is stored in managed artifact storage.
Metadata and authorized links remain in Test Desk so result history can outlive
Jenkins artifact retention.

Regression comparison requires a namespaced cross-revision Result Identity
plus explicit candidate Source Test Runs and a pinned Baseline. “Latest
successful” may be offered as a selection policy, but the resolved baseline
runs, revision, and Compatibility Fingerprint must be recorded before
comparison begins.

## Consequences

- The product can show all three test families for one application without
  forcing their output into a lowest-common-denominator table.
- Result ingestion is deterministic and testable independently of Jenkins UI
  or log wording.
- Jenkins jobs must publish manifests and machine-readable reports.
- Catalog, API, and persistence models must migrate from the previous
  `BDD | API | INTEGRATION` examples to `UI | INTEGRATION | REGRESSION`.
- BDD Definition Style and Framework become separate optional metadata.
- Reliable regression comparison requires durable history and stable result
  identifiers.
- Artifact authorization, redaction, retention, and size limits become
  platform responsibilities.

## Rejected alternatives

- **Treat BDD as a Test Type.** BDD does not define a unique execution or
  result contract and can describe UI or integration behavior.
- **Use Jenkins build result as the test result.** A failed build may mean an
  assertion failure, infrastructure failure, or missing report.
- **Display console logs as the main output.** Logs are runner-specific, noisy,
  difficult to compare, and unsafe to expose without redaction.
- **Merge all three types into one result table.** This hides the evidence users
  need to diagnose each class of failure.
