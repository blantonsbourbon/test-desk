# Test Desk

The shared language for a company-internal product that organizes test
capabilities, coordinates application-level runs, and presents trustworthy
results independently of the infrastructure that executes tests.

## Test definitions

**Application**:
The product or deployable service whose automated test capabilities and
results are grouped together.
_Avoid_: Jenkins job, repository, Test Suite

**Test Source**:
The authoritative Git repository where versioned test definitions and their
manifest are maintained. Test Desk reflects a Test Source but does not edit
or redefine its contents.
_Avoid_: Test database, platform copy

**Test Manifest**:
A versioned YAML declaration in a Test Source that describes an Application's
Test Suites, Test Cases, stable identities, source locations, and execution
metadata. It is part of the Test Source and is not a runtime result.
_Avoid_: Test database, execution report

**Test Source Revision**:
An immutable Git revision from which the Test Manifest, Test Suites, and Test
Cases are resolved.
_Avoid_: Latest code, mutable branch state

**Test Suite**:
A named group of related executable Test Cases that share one Source Test Type
(`UI` or `Integration`) and execution compatibility. A Suite organizes and
selects cases; it is not an Application Run.
_Avoid_: Jenkins job, Application Run, generic pipeline

**Test Case**:
One independently selectable, semantically meaningful test declared by the
Test Manifest. A Test Case has a stable identity across Test Source Revisions.
_Avoid_: Display row, run-local result

**Test Case Revision**:
The immutable parsed definition of a Test Case at one Test Source Revision,
including its source location, framework binding, parameters, and execution
reference.
_Avoid_: Mutable current case, Test Run

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

**Application Release**:
An immutable built version of an Application, identified by its release/build
identity and artifact identity. It is the application version that a test
evaluates.
_Avoid_: Git branch, Test Source Revision

**Deployment**:
The placement of an Application Release into an Environment. A Deployment
records which release was present at a target and supports replacement and
rollback history.
_Avoid_: Environment, Application Run

**Execution Provenance**:
The immutable facts connecting an Application Run to the Application Release,
Deployment, Test Source Revision, and execution context that produced it.
_Avoid_: Audit event, display metadata

**Run Snapshot**:
The immutable resolved selection and configuration used by an Application Run,
including the Test Cases, Test Case Revisions, Environment, and execution
policies selected at creation time.
_Avoid_: Current manifest, mutable run definition

## Execution

**Application Run**:
One revision-pinned request to evaluate an Application Release in one
Environment. It owns the child Test Runs created by `Run all` or by an
equivalent API request, and retains Execution Provenance and a Run Snapshot.
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
