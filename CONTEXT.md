# Test Desk

The shared language for a company-internal product that organizes test
capabilities, coordinates application-level runs, and presents trustworthy
results independently of the infrastructure that executes tests.

## Catalog

**Application**:
The product or deployable service whose automated test capabilities and
results are grouped together.
_Avoid_: Jenkins job, repository, Test Suite

**Test Source**:
The authoritative location where versioned test definitions are maintained.
Test Desk reflects a Test Source but does not redefine its contents.
_Avoid_: Test database, platform copy

**Test Catalog**:
A read-only view of test definitions synchronized from a Test Source for
discovery, execution, and result lookup.
_Avoid_: Test editor, test authoring tool

**Catalog Revision**:
A synchronized snapshot of a Test Source identified by one immutable source
revision.
_Avoid_: Latest code, mutable branch state

**Catalog Entry**:
The read-only representation of one independently selectable Test Definition
at a Catalog Revision.
_Avoid_: Scenario when referring to all test types, editable test

**Test Suite**:
A named group of related executable Catalog Entries that share one Source Test
Type (`UI` or `Integration`) and execution compatibility.
_Avoid_: Jenkins job, Application Run, generic pipeline

**Test Type**:
The result family of a Test Suite, Regression Policy, or Test Run: `UI`,
`Integration`, or `Regression`. Test Type does not identify a framework or
execution system.
_Avoid_: BDD, runner type, connector, Jenkins job

**Definition Style**:
An optional way a test is authored or presented, such as BDD. It does not
change Test Type, dispatch, or result semantics.
_Avoid_: Test Type, framework

**Test Framework**:
The library or report protocol used by a Test Suite, such as Playwright, Rest
Assured, Cucumber, or JUnit.
_Avoid_: Test Type, connector, execution environment

## Execution

**Application Run**:
One revision-pinned request to evaluate an Application in one Environment. It
owns the child Test Runs created by `Run all` or by an equivalent API request.
_Avoid_: RunSet, Jenkins pipeline, synthetic test result

**Application Run State**:
The coordination progress of an Application Run: `Created`, `Dispatching`,
`Running`, `Comparing`, `Completed`, or `Cancelled`. It is not a Test Outcome.
_Avoid_: Aggregate pass/fail, Jenkins status

**Test Run**:
One independently observable typed run within an Application Run. It owns its
execution lifecycle, outcome, result entries, evidence, and optional External
Execution.
_Avoid_: Application Run, Jenkins build

**Source Test Run**:
A UI or Integration Test Run whose normalized results can be used as candidate
input to a Regression Test Run.
_Avoid_: Baseline, comparison report

**Regression Test Run**:
A derived Test Run that compares completed candidate Source Test Runs with a
pinned compatible baseline. It remains a separate Test Type and result
workspace but is not dispatched in parallel with its inputs.
_Avoid_: Generic rerun, latest report, third parallel test job

**Regression Policy**:
The Application-owned configuration that selects candidate Source Test Runs,
baseline policy, comparison scope, and compatibility requirements.
_Avoid_: Jenkins parameter, mutable latest-successful pointer

**Execution Profile**:
A server-managed binding between a Test Suite and the configuration required
to execute it through one Execution Connector.
_Avoid_: User preset, Jenkins job exposed to the UI

**Execution Connector**:
The integration that dispatches and observes an External Execution, such as a
Jenkins connector.
_Avoid_: Test Type, Test Source, trigger

**External Execution**:
The queue item and build created in an external execution system for a Source
Test Run.
_Avoid_: Test Run, Catalog Entry

**Environment**:
The business-level deployment target against which an Application Run is
evaluated.
_Avoid_: Build agent, runner host

## State and results

**Execution Lifecycle**:
The progress of a Test Run: `Queued`, `Running`, `Collecting`, `Completed`, or
`Cancelled`.
_Avoid_: Test Outcome, Jenkins native status

**Test Outcome**:
The assertion result of valid normalized output: `Passed`, `Failed`, or
`Unknown`.
_Avoid_: Execution Lifecycle, Jenkins build result

**Ingestion State**:
The trust state of collected output: `Pending`, `Valid`, `Partial`, or `Error`.
_Avoid_: Test Outcome, artifact upload progress

**Result Entry**:
One normalized suite, journey, step, case, or comparison result within a Test
Run, identified by a stable cross-revision Result Identity.
_Avoid_: Display row, console line

**Result Identity**:
The namespaced identity used to correlate one logical result across revisions:
Application, Test Suite, stable case ID, and parameter key.
_Avoid_: Display name, row number, run-local ID

**Baseline**:
A resolved, immutable reference to compatible prior Source Test Runs used by a
Regression Test Run.
_Avoid_: Whatever passed most recently, mutable branch

**Compatibility Fingerprint**:
The environment, suite configuration, dataset, framework/report contract, and
comparison-policy identity that candidate and baseline must share.
_Avoid_: Source revision alone

**Evidence**:
A diagnostic artifact associated with a Test Run or Result Entry, exposed to
users only as an authorized sanitized derivative.
_Avoid_: Unrestricted raw build artifact, primary test outcome
