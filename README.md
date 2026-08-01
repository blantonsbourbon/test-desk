# Test Desk

Spring Boot 3 backend and Angular 19 console for an internal, generic Test Catalog and execution console.

The frontend design is documented in [docs/frontend-design.md](docs/frontend-design.md). It includes the screen behavior and the `/api/v1` contract that the backend implements.

The earlier v0.3 MVP model is retained as a historical design note in
[docs/mvp-multi-test-execution.md](docs/mvp-multi-test-execution.md).

The contributor seams for catalog adapters, execution connectors, profiles, origins, and normalized results are documented in [docs/architecture/generic-execution.md](docs/architecture/generic-execution.md).

The detailed current architecture is documented in [docs/architecture/testdesk-architecture.md](docs/architecture/testdesk-architecture.md), and the dependency-driven implementation plan is in [docs/roadmap.md](docs/roadmap.md).

The accepted target model uses exactly three Test Types—UI, Integration, and
Regression—with BDD treated as a Definition Style. The product and technical
design are documented in:

- [Test result workspaces](docs/design/test-results-workspaces.md)
- [Target Jenkins result-ingestion architecture](docs/architecture/jenkins-test-results.md)
- [ADR-0004: Use three Test Types and normalize Jenkins output](docs/adr/0004-use-three-test-types-and-normalize-jenkins-output.md)

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

1. Replace the in-memory catalog with a Git synchronizer and durable read model.
2. Add framework-specific catalog adapters and a non-BDD vertical slice.
3. Add Ansible/Jenkins connectors that submit a pinned commit, environment, and opaque selection references.
4. Persist executions, external references, results, and connector observations so queued/running history survives restarts.
5. Add authentication and authorization around source/environment access.
