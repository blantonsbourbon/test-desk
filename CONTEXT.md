# Test Control Plane

The shared language for a company-internal platform that organizes test capabilities and controls their execution across external test infrastructure.

## Language

**Test Control Plane**:
The internal product through which teams discover, manage, start, and observe automated tests, independently of the infrastructure that executes them.
_Avoid_: Test platform, test runner, Playwright platform

**Test Source**:
The authoritative location where versioned test definitions are maintained. The Test Control Plane reflects a Test Source but does not redefine its contents.
_Avoid_: Test database, platform copy

**Test Catalog**:
A read-only view of test definitions synchronized from a Test Source for discovery, execution, and result lookup.
_Avoid_: Test editor, test authoring tool, test database

**Feature**:
A named group of related BDD Scenarios. It organizes the Test Catalog and may be executed as a group, but is not itself an individual test.
_Avoid_: Test, test case, suite

**Scenario**:
The smallest independently discoverable and executable BDD test definition.
_Avoid_: Test case, script, step

**Scenario Outline**:
A parameterized Scenario represented once in the Test Catalog whose Examples are expanded into individual outcomes during execution.
_Avoid_: Scenario template, generated tests

**Catalog Revision**:
A synchronized snapshot of a Test Source identified by one immutable Git commit.
_Avoid_: Latest code, platform copy, test version

**Test Execution**:
A request to run one or more catalog entries against a specific Catalog Revision and record their outcomes.
_Avoid_: Job, task, pipeline run

**Environment**:
The business-level deployment target against which a Test Execution runs; the initial product supports only `dev` and `qa`.
_Avoid_: Server, runner, infrastructure target

**Execution Status**:
The lifecycle state of a Test Execution: `Queued`, `Running`, `Passed`, `Failed`, `Error`, or `Cancelled`.
_Avoid_: Pipeline status, job status
