# Group Test Runs and derive Regression comparisons

Status: accepted

One user intent to evaluate an Application creates an `Application Run` pinned
to one Environment and source revision. The Application Run owns independently
observable `Test Runs`: UI and Integration are Source Test Runs dispatched
through configured Execution Connectors, while Regression is a derived Test Run
created only after its configured candidate Source Test Runs reach a terminal
lifecycle. This preserves three separate result workspaces without pretending
that a final old/new comparison is an unrelated third job running in parallel.

A Regression Policy pins the candidate Source Test Runs, the resolved Baseline,
comparison scope, blocking-delta rules, and Compatibility Fingerprint before
comparison begins. If a required source report is invalid, the Regression Test
Run has `Ingestion State = Error` and `Test Outcome = Unknown`; partial inputs
may expose known deltas but keep `Ingestion State = Partial` and `Test Outcome =
Unknown`. A fully valid comparison is `Failed` only when its policy finds a
blocking delta, otherwise it is `Passed`.

Every Test Run records three independent axes: `Execution Lifecycle`
(`Queued | Running | Collecting | Completed | Cancelled`), `Test Outcome`
(`Passed | Failed | Unknown`), and `Ingestion State`
(`Pending | Valid | Partial | Error`). Jenkins native state remains connector
metadata. This prevents a valid assertion result, an infrastructure failure,
and report completeness from overwriting one another.

Result correlation across revisions uses the namespaced identity
`Application + Test Suite + stable case ID + parameter key`. Run-local IDs and
display names are not comparison keys.

## Consequences

- `Run all` is coordinated through an Application Run and can report partial
  dispatch without inventing a cross-type Test Outcome.
- An Application may own zero or more UI/Integration suites and Regression
  policies; type-level summaries aggregate their latest child Test Runs.
- Regression cannot start until its candidate inputs and Baseline are pinned.
- Source retries never rewrite an existing Regression result; a changed
  policy-version/candidate/Baseline tuple creates a new comparison attempt.
- External Execution is optional for derived Regression Test Runs.
- APIs, storage, manifests, URLs, and audit events must carry `applicationRunId`
  and the three state axes.

## Rejected alternatives

- Running Regression in parallel with the reports it compares leaves its
  candidate input undefined or race-prone.
- A single status cannot truthfully represent lifecycle, assertion outcome, and
  report trust at the same time.
- Grouping runs only in the browser cannot reliably reconstruct one `Run all`
  request after retries, partial dispatch, or restart.
