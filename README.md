# Test Desk

Spring Boot 3 backend and Angular 19 console for an internal, generic Test Catalog and execution console.

The current `v0.3.0` frontend behavior and `/api/v1` contract are recorded in
[docs/frontend-design.md](docs/frontend-design.md). This is a migration
reference rather than the target result experience.

The earlier v0.3 MVP model is retained as a historical design note in
[docs/mvp-multi-test-execution.md](docs/mvp-multi-test-execution.md).

The target contributor seams for catalog adapters, execution connectors,
result ingestion, and Regression comparison are documented in
[docs/architecture/generic-execution.md](docs/architecture/generic-execution.md).

The detailed current architecture is documented in [docs/architecture/testdesk-architecture.md](docs/architecture/testdesk-architecture.md), and the dependency-driven implementation plan is in [docs/roadmap.md](docs/roadmap.md).

The accepted target model uses exactly three Test Types—UI, Integration, and
Regression—with BDD treated as a Definition Style. The product and technical
design are documented in:

- [Test result workspaces](docs/design/test-results-workspaces.md)
- [Target Jenkins result-ingestion architecture](docs/architecture/jenkins-test-results.md)
- [ADR-0004: Use three Test Types and normalize Jenkins output](docs/adr/0004-use-three-test-types-and-normalize-jenkins-output.md)
- [ADR-0005: Group Test Runs and derive Regression comparisons](docs/adr/0005-group-test-runs-and-derive-regression-comparisons.md)

## Requirements

- Java 17+
- Gradle 8.14+ (or the checked-in Gradle wrapper)
- Node.js 20+ (frontend)

The Gradle build compiles with `--release 17` and enables Java parameter metadata for Spring MVC binding. Spring Boot is pinned to `3.5.16`.

## Run backend

```bash
./gradlew bootRun
```

The API listens on `http://localhost:8080`.

## Run frontend

```bash
cd frontend
npm install
npm start
```

The UI listens on `http://localhost:4200` and calls `http://localhost:8080/api/v1`.

CORS allows `http://localhost:4200` (plus 3000/5173). Alternatively set `apiBaseUrl` to `/api/v1` and use the Angular dev-server proxy (`frontend/proxy.conf.json`).

## Verify

```bash
./gradlew test
curl http://localhost:8080/api/v1/sources
curl 'http://localhost:8080/api/v1/catalog?sourceId=checkout-web'
curl -X POST http://localhost:8080/api/v1/executions \
  -H 'Content-Type: application/json' \
  -d '{"sourceId":"checkout-web","entryIds":["checkout-valid-card"],"environment":"qa","revisionCommit":"a13f9c2","origin":"rest_api"}'
```

## Backend boundary

The application currently uses an in-memory catalog and simulation connector so the complete API flow can be exercised without external infrastructure. BDD data is supplied by `BddSimulationCatalogAdapter`; a real Git/framework adapter can replace it without changing the catalog API. `ExecutionOrchestrator` resolves a server-managed `ExecutionProfile` and talks to an `ExecutionConnector`, keeping external dispatch details out of REST controllers and the generic domain model.

The next production seams are:

1. Migrate the contract to Application Run, Test Run, the three accepted Test
   Types, and independent Lifecycle / Outcome / Ingestion state.
2. Persist coordination, child attempts, External Executions, observations,
   manifests, and normalized results so retry and restart are safe.
3. Add Jenkins dispatch plus versioned Result Manifest ingestion for one UI
   suite and one Integration suite.
4. Add Baseline resolution, Compatibility Fingerprint, and the derived
   Regression comparator.
5. Deliver the desktop result workspaces, sanitized Evidence authorization,
   retention, and operational hardening.

The detailed order and acceptance gates are maintained in
[docs/roadmap.md](docs/roadmap.md).
