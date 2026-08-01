# Separate Test Types from Execution Connectors

> Status: Accepted. The separation decision remains current; the original Test
> Type examples are superseded by
> [ADR-0004](0004-use-three-test-types-and-normalize-jenkins-output.md).

Test Type describes what a Test Definition validates (`UI`, `Integration`, or
`Regression`), while an Execution Connector describes how a Test Execution is
dispatched and observed (`Ansible` or `Jenkins`). Test Desk keeps these as
independent axes and binds them through server-managed Execution Profiles,
rather than encoding connector details in catalog entries or accepting a
connector choice from the client; this lets one test type move between
execution systems without changing the catalog or public execution contract.

## Consequences

The MVP allows only Catalog Entries resolved to the same Execution Profile in one Test Execution. Connector credentials, job names, command templates, and other infrastructure configuration remain outside the client API. A later orchestrator may fan one user request out to several profiles, but the MVP does not create partially successful multi-connector executions.
