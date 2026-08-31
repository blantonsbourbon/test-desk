# Manual Test Case lifecycle — agent handoff

Implementation handoff for Git-synced **manual** Test Cases in Test Desk.

- GitHub issue: https://github.com/blantonsbourbon/test-desk/issues/5 (`ready-for-agent`)
- Repo: `blantonsbourbon/test-desk`
- This zip is the design pack. Implement in the repo; do not treat the zip as a second source of truth after merge.

## Read order

1. `CONTEXT.md` — glossary. Use these terms exactly.
2. `docs/adr/0006-manual-execution-mode-is-not-a-test-type.md` — Manual is Execution Mode, not a Test Type.
3. `docs/adr/0004-use-three-test-types-and-normalize-jenkins-output.md` — Test Types stay `UI | Integration | Regression`.
4. `docs/specs/manual-test-case-lifecycle.md` — **this feature’s spec** (user stories, schema, API, tests).
5. `docs/design/manual-test-case-lifecycle.html` — clickable concept prototype (Catalog, diff, record run, timeline).
6. `docs/specs/git-first-test-definitions-and-provenance.md` — existing Git sync, projection, Application Run, snapshot, results.
7. `PRODUCT.md` + `DESIGN.md` — console voice and visual tokens. No in-app authoring.

Supporting ADRs in `docs/adr/`: 0001 Git is source, 0002 pin to commit, 0003 type vs connector, 0005 Application Run grouping.

## Non-negotiables

- Git YAML is the only authoring path. Test Desk does not create, edit, or deprecate cases in the UI.
- Test Type remains exactly `UI`, `Integration`, `Regression`. Do **not** add `Functional` or `Manual` as a type.
- Execution Mode is suite-level: `Automated` | `Manual`. A suite cannot mix modes.
- No `ManualExecutionConnector`, no parallel `FunctionalCase` / `Test Plan` aggregate.
- One test seam: Git fixture → manifest sync → Application Run / Manual Test Run → record step results + Evidence → query snapshot / timeline. Do not add a new catalog adapter or connector seam.
- Manual Test Runs have no Execution Profile, no External Execution, no `Collecting` lifecycle.
- Each snapshot **step** is a Result Entry with status, optional actual, optional comment, and Evidence attach **always visible**. Pass/Skip do not require note or screenshot. Blocked requires that step’s comment. Failed Evidence is optional but lives on the failing step, not a case-level dump.
- Comment is a single result field (last write wins on the open attempt), not a discussion thread.
- Definition Lifecycle (`draft` / `active` / `deprecated` / absent) is Git-owned.
- Pin every run to Test Source Revision + Application Release + Environment.

## Prototype map

Open `docs/design/manual-test-case-lifecycle.html` in a browser.

| Screen | What to implement |
|---|---|
| 1 Catalog | Read-only projection; filter Execution Mode / lifecycle; “never run on this rev” vs older result; “steps changed” |
| 2 Revision diff | Added / changed / deprecated from Git; old Passed does not cover new steps |
| 3 Record run | Per-step Pass/Fail/Block/Skip + actual + comment + attach; case note optional; complete disabled until all selected cases are terminal |
| 4 Case timeline | Interleave Git definition events with executions |

## Copy these files into the repo (if not already there)

Uncommitted / new in the design thread:

- `CONTEXT.md` (Execution Mode, Manual Test Run, Definition Lifecycle, Manual Result Status)
- `docs/adr/0006-manual-execution-mode-is-not-a-test-type.md`
- `docs/specs/manual-test-case-lifecycle.md`
- `docs/design/manual-test-case-lifecycle.html`

## Out of scope (do not build)

In-app case editor or review workflow; fourth Test Type; Manual connector; requirement/defect two-way sync; binding manual cases to automation; Regression of manual runs; exploratory sessions; comment threads.
