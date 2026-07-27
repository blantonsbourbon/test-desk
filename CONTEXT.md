# Test Desk

The shared language for a company-internal product that organizes test capabilities and controls their execution across external test infrastructure.

## Language

**Test Desk**:
The internal product through which teams discover, manage, start, and observe automated tests, independently of the infrastructure that executes them.
_Avoid_: Test platform, test runner, Playwright platform, Test Control Plane

**Test Source**:
The authoritative location where versioned test definitions are maintained. Test Desk reflects a Test Source but does not redefine its contents.
_Avoid_: Test database, platform copy

**Test Catalog**:
A read-only view of test definitions synchronized from a Test Source for discovery, execution, and result lookup.
_Avoid_: Test editor, test authoring tool, test database

**Test Definition**:
A versioned description of an independently selectable test, such as a BDD Scenario, API test, or integration test.
_Avoid_: Catalog row, runner job, execution

**Catalog Entry**:
The read-only representation of one Test Definition at a Catalog Revision. It carries the stable identity used to select that definition for execution.
_Avoid_: Scenario when referring to all test types, editable test

**Test Type**:
The behavioral form of a Test Definition, initially `BDD`, `API`, or `Integration`. Test Type does not determine how the test is dispatched.
_Avoid_: Runner type, trigger type, connector

**Test Framework**:
The concrete library or protocol used to describe and interpret a Test Definition, such as Cucumber for BDD or Postman for API tests. It helps choose a Catalog adapter and Execution Profile, but is not itself a trigger mechanism.
_Avoid_: Test Type, connector, execution environment

**Test Group**:
A named collection of related Catalog Entries. A BDD Feature is one kind of Test Group; other test types may use suites or collections.
_Avoid_: Execution, pipeline, runner group

**Feature**:
A BDD Test Group containing related Scenarios. It may be selected as a group, but is not itself an individual Test Definition.
_Avoid_: Test, test case, generic group

**Scenario**:
An independently discoverable and executable BDD Test Definition.
_Avoid_: Generic name for every test type, script, step

**Scenario Outline**:
A parameterized Scenario represented once in the Test Catalog whose Examples are expanded into individual outcomes during execution.
_Avoid_: Scenario template, generated tests

**Catalog Revision**:
A synchronized snapshot of a Test Source identified by one immutable Git commit.
_Avoid_: Latest code, platform copy, test version

**Test Execution**:
A request to run one or more Catalog Entries against a specific Catalog Revision and record their outcomes.
_Avoid_: Job, task, pipeline run

**Execution Profile**:
A server-managed binding between compatible Catalog Entries and the configuration required to execute them through one Execution Connector. Users select tests and an Environment, not an Execution Profile.
_Avoid_: User preset, Jenkins job, runner exposed to the UI

**Execution Connector**:
The integration that dispatches a Test Execution to an external execution system and observes or cancels it, such as an Ansible or Jenkins connector.
_Avoid_: Test Type, Test Source, trigger

**Execution Origin**:
The controlled channel that requested a Test Execution, initially `UI`, `REST_API`, `SCHEDULE`, or `WEBHOOK`. It is audit metadata, not a connector choice.
_Avoid_: trigger command, external execution reference

**External Execution**:
The corresponding run created in an external execution system for a Test Execution, identified by an opaque external reference.
_Avoid_: Test Execution, Catalog Entry

**Environment**:
The business-level deployment target against which a Test Execution runs; the initial product supports only `dev` and `qa`.
_Avoid_: Server, runner, infrastructure target

**Execution Status**:
The lifecycle state of a Test Execution: `Queued`, `Running`, `Passed`, `Failed`, `Error`, or `Cancelled`.
_Avoid_: Pipeline status, job status
