# Separate Test Types from Execution Connectors

> Status: Accepted. The separation decision remains current; the original Test
> Type examples are superseded by
> [ADR-0004](0004-use-three-test-types-and-normalize-jenkins-output.md).

Test Type describes the result family (`UI`, `Integration`, or `Regression`),
while an Execution Connector describes how a Source Test Run is
dispatched and observed (`Ansible` or `Jenkins`). Test Desk keeps these as
independent axes and binds executable suites through server-managed Execution
Profiles, rather than encoding connector details in catalog entries or
accepting a connector choice from the client; this lets one source test type
move between execution systems without changing the catalog or public
execution contract. Derived Regression Test Runs do not require a connector.

## Consequences

The original `v0.3.0` execution allows only Catalog Entries resolved to the
same Execution Profile. In the accepted target model,
[ADR-0005](0005-group-test-runs-and-derive-regression-comparisons.md) introduces
an Application Run that coordinates multiple child Test Runs while each child
still resolves exactly one Execution Profile. Connector credentials, job names,
command templates, and other infrastructure configuration remain outside the
client API.
