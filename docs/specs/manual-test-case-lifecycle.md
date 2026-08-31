# Manual Test Case lifecycle (Git-first)

## Problem Statement

Teams already keep automated tests in Git and want the same for manual UI and
Integration cases: write a YAML Test Manifest, review it in the repository,
and let Test Desk sync a read-only projection. Today Test Desk has no place
for those cases after sync. Testers cannot see which definitions appeared,
changed, or were deprecated; cannot start a revision-pinned run; cannot record
pass/fail/blocked/skipped against the exact steps that were committed; and
cannot tell a missing manual result from a passing one during an incident.

The product must not become a second authoring system. If testers edit steps
or deprecate cases in Test Desk, Git stops being the Test Source. At the same
time, Git cannot record who tested which Application Release in which
Environment. That execution record is what Test Desk must own.

Manual work is not a fourth Test Type. A manual checkout journey is still UI;
a manual API checklist is still Integration. The missing axis is how results
are obtained.

## Solution

Keep Git as the only authoring path. A Test Manifest may declare UI or
Integration Test Suites with Execution Mode `Manual`. Test Desk synchronizes
one Test Source Revision and projects stable Test Suites, Test Cases, and
Test Case Revisions, including Definition Lifecycle (`draft`, `active`,
`deprecated`, or absent).

Testers browse that projection, start an Application Run pinned to a Test
Source Revision, Application Release, and Environment, and record results
against the Run Snapshot. A Manual Test Run is a Source Test Run with no
Execution Connector, no Execution Profile, and no External Execution. It
reuses Result Entry, Evidence, attempt, and the three state axes. Manual
Result Status (`Passed`, `Failed`, `Blocked`, `Skipped`) lives on the case or
step; Test Outcome remains `Passed`, `Failed`, or `Unknown`.

Definition changes continue through Git. Execution history, assignment, and
evidence live in Test Desk. Changing a definition does not rewrite past runs.

## User Stories

1. As an Application owner, I want to declare Manual UI and Integration Suites
   in the same YAML Test Manifest as Automated Suites, so that one Test Source
   describes every selectable Test Case.
2. As an Application owner, I want each Suite to declare exactly one Test Type
   (`UI` or `Integration`) and exactly one Execution Mode (`Automated` or
   `Manual`), so that result family and recording path stay independent.
3. As an Application owner, I want a Case to keep a stable `case_key` when its
   name, steps, or tags change, so that history still belongs to the same Test
   Case.
4. As an Application owner, I want each Manual Case to declare preconditions,
   ordered steps with expected results, tags, priority, and Definition
   Lifecycle status, so that testers execute the committed procedure.
5. As an Application owner, I want `draft`, `active`, and `deprecated` to be
   manifest fields, so that readiness is reviewed in Git instead of in Test
   Desk.
6. As an Application owner, I want removing a Case from the manifest to keep
   its stable identity, so that old runs still resolve.
7. As an Application owner, I want a bad Manual Suite to fail the whole
   manifest parse, so that a broken YAML file cannot publish a partial catalog.
8. As a platform operator, I want to sync a chosen Git ref, so that Test Desk
   projects the committed Manual Cases at that exact commit.
9. As a platform operator, I want sync of the same commit and parser version
   to be idempotent, so that webhook retries do not duplicate Suites or Cases.
10. As a platform operator, I want a failed sync to leave the last valid
    revision active, so that testers are not sent to an unreadable catalog.
11. As a platform operator, I want parser and schema versions recorded on the
    Test Source Revision, so that a later parser change is not mistaken for a
    Git change.
12. As a Test Engineer, I want to browse Manual Cases at a selected Test
    Source Revision, so that I see the steps I will execute, not a later edit.
13. As a Test Engineer, I want to filter by Suite, Test Type, Execution Mode,
    tag, priority, Definition Lifecycle status, last Manual Result Status, and
    never-run, so that I can build a focused run quickly.
14. As a Test Engineer, I want deprecated Cases visible but excluded from
    default selection, so that I do not silently re-run retired procedures.
15. As a Test Engineer, I want draft Cases visible to people inspecting the
    revision but excluded from default selection, so that unready procedures
    are not treated as coverage.
16. As a Test Engineer, I want a read-only Case detail that shows
    preconditions, steps, expected results, tags, source path, and current
    Definition Lifecycle status, so that I never think Test Desk can edit them.
17. As a Test Engineer, I want to compare two Test Source Revisions and see
    added, removed, and changed Manual Cases, so that I know what the last
    Git commit actually altered.
18. As a Test Engineer, I want a changed `definition_hash` to mark previous
    executions as covering an older procedure, so that I do not treat stale
    evidence as coverage of the current steps.
19. As a Test Engineer, I want a Case that moved Suites between revisions to
    keep its `case_key` and show the membership change, so that I can still
    find its history.
20. As a Test Engineer, I want to create a Run Definition that selects Manual
    Cases by Suite, Case, tag, path, Test Type, and Execution Mode, so that I
    do not rebuild the same set every release.
21. As a Test Engineer, I want to start an Application Run from an explicit
    Test Source Revision, Application Release, and Environment, so that a
    moving branch cannot change the steps after I begin testing.
22. As a Test Engineer, I want the run to snapshot every selected Manual Case
    Revision, so that later Git commits cannot rewrite what I was asked to
    execute.
23. As a Test Engineer, I want Manual Suites in a `Run all` to become Manual
    Test Runs instead of connector dispatches, so that the product does not
    pretend Jenkins will execute them.
24. As a Test Engineer, I want Automated and Manual child Test Runs to coexist
    in one Application Run, so that one release evaluation can include both
    pipelines and human checks.
25. As a Test Engineer, I want each Manual Suite to get its own Test Run, so
    that UI and Integration workspaces stay suite-scoped and are not merged
    into one fake build.
26. As a Test Engineer, I want a Manual Test Run to start `Queued` and become
    `Running` when recording begins, so that progress is visible without a
    `Collecting` phase.
27. As a Test Engineer, I want to assign a selected Case to a tester, so that
    the team can see who owns the remaining work.
28. As a Test Engineer, I want to record a Case as Passed, Failed, Blocked, or
    Skipped without changing the Git definition, so that execution state lives
    on the run.
29. As a Test Engineer, I want to record the same statuses on individual
    steps, so that a long procedure can fail on the exact action that broke.
30. As a Test Engineer, I want Blocked on a step to require that step's
    comment as the reason, so that “could not run” is not stored as a bare
    status.
31. As a Test Engineer, I want every step to keep the expected text from the
    Case Revision and to have its own actual-result and comment fields, so
    that diagnosis does not depend on a case-level dump or chat history.
32. As a Test Engineer, I want Skipped to be an explicit action, so that
    unexecuted Cases are not silently treated as skipped.
33. As a Test Engineer, I want an Evidence attach control on every step, so
    that a screenshot or log sits on the Result Entry it belongs to.
34. As a Test Engineer, I want comment and Evidence on a step to stay optional
    when the step Passed or Skipped, so that a clean pass does not require
    empty ceremony.
35. As a Test Engineer, I want to leave a comment or screenshot on a Passed
    step without changing its status, so that a warning is not forced into a
    failure.
36. As a Test Engineer, I want an optional case-level note and Evidence slot
    for facts that are not step-specific, so that I do not overload a single
    step with run-wide context.
37. As a Test Engineer, I want to change a recorded status while the attempt
    is still open, so that I can correct a mis-click before the run closes.
38. As a Test Engineer, I want completed attempts to be immutable, so that a
    later retest cannot erase the first result.
39. As a Test Engineer, I want the product to refuse recording against any
    Case Revision other than the snapshot, so that I cannot mix two Git
    versions in one run.
40. As a Test Engineer, I want bulk skip or bulk assign on remaining
    not-started Cases, so that closing a large run does not require opening
    every row.
41. As a Test Engineer, I want completing a Manual Test Run to be rejected
    until every selected Case has a terminal Manual Result Status, so that
    coverage cannot be claimed by omission.
42. As a Test Engineer, I want cancelling a Manual Test Run to leave
    unrecorded Cases as not run, so that cancel is not converted into skip or
    pass.
43. As a Test Engineer, I want run-level Test Outcome to be Failed if any Case
    is Failed, Unknown if any Case is Blocked or the run is incomplete, and
    Passed only when every Case is Passed or Skipped and ingestion is Valid,
    so that blocked work is not reported as a test failure.
44. As a Test Engineer, I want Ingestion State to be Pending, Partial, Valid,
    or Error based on recording completeness and payload well-formedness, so
    that trust is visible without a runner artifact.
45. As a Test Engineer, I want a progress count of recorded versus selected
    Cases, so that I can see remaining manual work at a glance.
46. As a Test Engineer, I want to retest Failed or Blocked Cases as a new
    attempt on the same Test Run, so that the original evidence remains.
47. As a Test Engineer, I want a Case timeline that interleaves Definition
    Lifecycle events with executions, so that I can see whether a failure
    happened before or after the steps changed.
48. As a Test Engineer, I want last result, last tester, last Environment, and
    last Application Release on the catalog row, so that I can scan freshness
    without opening history.
49. As a Test Engineer, I want “never run on this revision” to be distinct
    from “ran on an older revision”, so that a Git change is not hidden by a
    green last-result chip.
50. As an Incident Responder, I want to find Manual Test Runs by Application
    Release, Deployment, image digest, Environment, and time, so that I know
    whether humans evaluated the affected version.
51. As an Incident Responder, I want selected-but-not-run, Blocked, Failed,
    Passed, Skipped, and cancelled to be distinct, so that a missing manual
    result is not read as Passed.
52. As an Incident Responder, I want each result to link to the pinned Test
    Source Revision and the recorded steps, so that I can reconstruct the
    procedure that was followed.
53. As an Incident Responder, I want authorized Evidence links on the Failed
    or Blocked step, so that I can inspect what the tester saw without hunting
    a case-level dump.
54. As an Auditor, I want append-only events for sync, run creation,
    assignment, recording, evidence upload, completion, cancellation, and
    retry, so that manual results are explainable.
55. As a platform operator, I want duplicate record submissions for the same
    open attempt and Case to be idempotent, so that a retried save does not
    create two results.
56. As a product engineer, I want Manual recording to sit on the same
    source-to-run application boundary as Automated execution, so that
    adapters and connectors are not invented for a path that has no external
    system.

## Implementation Decisions

### Domain

- Test Type remains exactly `UI`, `Integration`, and `Regression` (ADR-0004,
  ADR-0006). Manual is Execution Mode, not a type.
- Execution Mode is declared on the Test Suite at a Test Source Revision.
  Cases inherit it; a Suite cannot mix Automated and Manual Cases.
- Default Execution Mode is `Automated` when omitted, so existing manifests
  stay valid.
- Manual UI Test Runs use the UI result workspace (ordered steps, expected
  versus actual, screenshots). Manual Integration Test Runs use the
  Integration workspace (case/step hierarchy, assertion notes). They are not
  a third workspace.
- Do not introduce `FunctionalCase`, `Test Plan`, or `ManualExecutionConnector`.
- Run Definition remains the reusable selector. A release checklist is an
  Application Run (or a Run Definition used to create one), not a new
  aggregate.
- Definition Lifecycle is Git-owned. Test Desk never mutates `draft` /
  `active` / `deprecated` or step text.

### Manifest contract

- Extend the versioned Test Manifest so a Suite may declare `executionMode:
  MANUAL | AUTOMATED`.
- A Manual Case definition includes stable `case_key`, name, optional
  priority, tags, Definition Lifecycle status, preconditions, and an ordered
  `steps` list with stable step ids, action, and expected result.
- Status values in YAML are `draft`, `active`, and `deprecated`. Absence from
  the current manifest is removal, not a fourth YAML value.
- Manual Suites may omit Test Framework. Framework must not be used as the
  mode discriminator.
- Definition Style remains optional (`STEPS`, BDD, and so on) and does not
  choose Execution Mode.
- Validation fails the entire revision on mixed mode inside one Suite,
  missing `case_key`, duplicate step ids, empty steps for Manual Cases,
  invalid Test Type, or invalid Execution Mode.

### Persistence

- Project Manual Suites and Cases through the existing `test_suite`,
  `test_suite_revision`, `test_case`, and `test_case_revision` tables.
- Store Execution Mode on `test_suite` (current) and `test_suite_revision`
  (immutable). Store steps, preconditions, priority, and YAML status inside
  the immutable `test_case_revision.definition` JSONB plus queryable columns
  for status, priority, and `definition_hash` where they must be filtered.
- Persist Manual Test Runs in `test_run` with `execution_mode = MANUAL`,
  null `execution_profile_id`, and null connector/external execution.
- Reuse `application_run_case` as the snapshot row. Add assignee, recorded-by,
  and Manual Result Status (or map them onto existing execution_state plus
  Result Entry). Terminal snapshot states must distinguish
  `NOT_RUN`, `IN_PROGRESS`, `PASSED`, `FAILED`, `BLOCKED`, `SKIPPED`, and
  `CANCELLED`.
- Record step and case results as `result_entry` rows on `test_run_attempt`.
  Manual Result Status is entry `status`; Test Outcome aggregation stays on
  the Test Run.
- Store tester uploads as `artifact` rows of kind `EVIDENCE` linked to the
  attempt and optional Result Entry.
- Do not rewrite `test_case_revision` when a tester records a result.

### Run coordination

- Creating an Application Run resolves selectors against one Test Source
  Revision. Default selectors include `active` Cases only.
- Automated Suites still resolve an Execution Profile and submit through an
  Execution Connector.
- Manual Suites skip profile resolution and connector submit. Each selected
  Manual Suite becomes a Manual Test Run in `Queued`.
- Application Run State remains Running until Automated children are terminal
  and Manual children are Completed or Cancelled.
- Manual Test Runs transition `Queued → Running → Completed | Cancelled` and
  never enter `Collecting`.
- Retry of Failed or Blocked Cases creates a new `test_run_attempt`. The
  previous attempt stays immutable.
- Completing a Manual Test Run requires every selected Case on the current
  attempt to have a terminal Manual Result Status. Completion does not
  implicit-skip the rest.
- Cancellation is allowed from `Queued` or `Running`. Unrecorded Cases stay
  `NOT_RUN`.

### Step recording

- Each snapshot step is a child Result Entry of the Case Result Entry.
- Every step Result Entry always has: Manual Result Status, optional `actual`,
  optional `comment`, and zero or more Evidence artifacts.
- The recording UI always shows comment and Evidence attach on every step.
  Passed and Skipped do not require either field.
- Blocked on a step requires that step's comment. Failed does not require
  Evidence; the attach control stays visible so a tester can add it without
  leaving the step.
- Comment is one result field per Result Entry. Last write wins on the open
  attempt. It is not a discussion thread.
- A case-level note and Evidence slot remain for facts that are not
  step-specific. They do not replace step Evidence.
- Failed Evidence is stored on the step Result Entry, matching the existing
  rule that failed evidence stays adjacent to its Result Entry.

### Result aggregation

- Case Failed → Test Outcome `Failed`.
- Else any Blocked, any `NOT_RUN` after cancel, or Ingestion not Valid →
  Test Outcome `Unknown`.
- Else all Cases Passed or Skipped and Ingestion Valid → Test Outcome
  `Passed`.
- Ingestion State: `Pending` if no Case recorded; `Partial` if some but not
  all have terminal status; `Valid` if all terminal recordings are
  well-formed; `Error` if a payload or Evidence constraint fails.
- Skipped is a Result Entry / Manual Result Status. It is not a Test Outcome.

### API behavior

Expose application-level operations equivalent to:

- sync and inspect a Test Source Revision that contains Manual Suites;
- list and filter Suites/Cases including Execution Mode and Definition
  Lifecycle status;
- diff two revisions for added/removed/changed Manual Cases;
- create an Application Run that snapshots Manual selections;
- assign a snapshot Case;
- record or replace Case and step Manual Result Status, actual, and comment
  on the open attempt;
- attach or remove Evidence on a step or case Result Entry;
- bulk skip remaining not-started Cases;
- complete or cancel a Manual Test Run;
- retry Failed/Blocked Cases as a new attempt;
- inspect Case timeline (definition revisions + executions);
- inspect incident-oriented runs with selected-but-not-run distinguished.

Clients never send connector, profile, credentials, or job parameters. Clients
never send edited step text as a definition change; actual-result and comment
fields are result payload only.

### Modules and seams

- Extend the existing Git-first source-to-run application boundary. That is
  the only external seam.
- Inside that module, Automated dispatch continues to use Execution Profile
  plus Execution Connector. Manual recording is a command on the same
  Application Run / Test Run aggregate (`RecordManualResult`,
  `AttachManualEvidence`, `CompleteManualTestRun`).
- Do not add a CatalogDefinitionAdapter for Manual Cases. Do not add a
  connector implementation that “executes” a person.
- The v0.3 in-memory catalog remains migration evidence only.

## Testing Decisions

Good tests assert externally observable behavior: projected catalog at a
commit, immutable snapshots, recorded statuses, aggregation, and incident
queries. They do not assert parser internals, table layout, or UI component
structure.

The single acceptance seam is the Git-first source-to-run boundary:

```text
Git fixture (UI/Integration YAML with executionMode MANUAL @ commit)
  -> manifest sync / Suite+Case projection
  -> Application Run + Manual Test Run (no connector)
  -> record case/step results + Evidence
  -> query snapshot, three state axes, Case timeline
```

Prior art: `TestDeskApiTest` for HTTP/application behavior;
`ExecutionProfileRegistryTest` for Automated profile rules; the git-first
spec’s fixture style for manifest sync and run snapshots.

Required fixtures and cases:

- Valid Manual UI Suite and Manual Integration Suite in one manifest with
  Automated Suites.
- Default Execution Mode `Automated` when the field is omitted.
- Reject mixed Execution Mode inside one Suite; reject Manual Case without
  steps; reject unknown mode or fourth Test Type.
- Idempotent re-sync of the same commit; failed parse leaves previous revision
  active.
- Revision diff: add, remove, rename, step text change, status change to
  deprecated.
- Run creation snapshots Case Revisions; recording against another revision
  is rejected.
- Default selection skips `draft` and `deprecated`.
- Record Passed/Failed/Blocked/Skipped at case and step; Blocked without
  step comment is rejected.
- Attach Evidence to a step Result Entry; a Passed step may still carry a
  comment or screenshot.
- Case-level note does not move or hide step Evidence.
- Last write wins on an open attempt; completed attempt is immutable.
- Duplicate record requests are idempotent.
- Complete rejected while any Case is `NOT_RUN`; explicit bulk skip then
  complete succeeds.
- Cancel leaves unrecorded Cases as not run; Outcome `Unknown`.
- Aggregation: all Passed/Skipped → Passed; any Failed → Failed; any Blocked
  → Unknown.
- Retry Failed/Blocked creates a new attempt; original Evidence remains.
- Automated sibling still dispatches through the connector; Manual sibling
  never creates External Execution.
- Incident query by Application Release distinguishes selected-but-not-run
  from Passed.
- Case timeline shows a Git step change between two executions.
- No Execution Profile resolution is attempted for Manual Suites (registry
  tests stay Automated-only).

## Out of Scope

- Creating, editing, reviewing, or deprecating Test Cases in the Test Desk UI.
- Adding `Functional` or `Manual` as a Test Type.
- A Manual Execution Connector or fake external job for human work.
- A parallel Functional Case / Test Plan aggregate.
- Requirement management and coverage matrices beyond run selection.
- Defect-tracker two-way sync (linking an issue id on a result may come later).
- Binding a Manual Case to an Automated Case as “the automation for this”).
- Using Manual Test Runs as Regression candidates.
- Exploratory sessions, mind maps, or session-based test management.
- Comment threads, @-mentions, or in-app discussion on a step. Comment is a
  single result field.
- Multi-repository manifests, in-app custom fields editors, and branching
  workflows beyond syncing an explicit Git ref.
- Changing Automated Jenkins ingestion, connector contracts, or ADR-0004
  result families.

## Further Notes

- First phase authoring is Git YAML only; this spec is the lifecycle after
  sync, not an authoring roadmap.
- PRODUCT.md’s “catalog is read-only” rule still applies to definitions.
  Recording a result is execution, not authoring.
- Priority and tags are manifest metadata. They are filters, not a Test Desk
  workflow.
- Assignment is optional metadata on the snapshot row. Phase 1 does not
  require claim-to-record.
- If a future phase adds in-app authoring, it must write back through Git. It
  must not mutate `test_case_revision` in place.
