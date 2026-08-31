# Manual execution is a mode, not a Test Type

ADR-0004 keeps exactly three Test Types (`UI`, `Integration`, `Regression`)
because those are result families, not dispatch mechanisms. Manual cases are
ordinary UI or Integration Test Cases whose results are recorded by a tester
instead of collected from an External Execution. Test Desk therefore adds
**Execution Mode** (`Automated` | `Manual`) as a suite-level axis independent
of Test Type, Definition Style, and Execution Connector. Definition Lifecycle
stays in Git; a Manual Test Run has no Execution Profile and no External
Execution, and still occupies the UI or Integration result workspace.

## Considered options

- Add `Functional` or `Manual` as a fourth Test Type: rejected. Manual names
  how results are obtained, not the result family. A manual UI case still
  produces journey/step evidence; a manual Integration case still produces
  case/assertion evidence.
- A `ManualExecutionConnector`: rejected. There is no external execution
  system to dispatch or observe.
- A parallel `FunctionalCase` aggregate: rejected. Test Case is already the
  stable selectable identity.
- Encode mode as `framework: manual`: rejected. Framework is a report
  protocol, not an execution path.

## Consequences

- ADR-0004 is unchanged. Regression remains derived.
- A Test Suite has exactly one Source Test Type and one Execution Mode at a
  revision; Automated and Manual cases are not mixed inside one Suite.
- Execution Profiles and connectors apply only to Automated Source Test Runs.
- One Application Run may own Automated and Manual child Test Runs together.
- Using Manual Source Test Runs as Regression candidates is not decided here.
