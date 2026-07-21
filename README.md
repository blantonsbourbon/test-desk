# Test Control Plane

Spring Boot 3 backend for the internal BDD Test Catalog and execution console.

The frontend handoff is documented in [docs/frontend-design.md](docs/frontend-design.md). It includes the screen behavior and the `/api/v1` contract that this backend implements.

## Requirements

- Java 17+
- Maven 3.6.3+

The Maven build compiles with `--release 17`. Spring Boot is pinned to `3.5.16`.

## Run

```bash
mvn spring-boot:run
```

The API listens on `http://localhost:8080`.

## Verify

```bash
mvn test
curl http://localhost:8080/api/v1/sources
curl 'http://localhost:8080/api/v1/catalog?sourceId=checkout-web'
curl -X POST http://localhost:8080/api/v1/executions \
  -H 'Content-Type: application/json' \
  -d '{"sourceId":"checkout-web","scenarioIds":["checkout-valid-card"],"environment":"qa"}'
```

## Backend boundary

The application currently uses an in-memory catalog and `SimulationExecutionRunner` so the complete API flow can be exercised without external infrastructure. `ExecutionRunner` is the integration port for the real Ansible/Windows runner; replacing the simulation adapter is intentionally isolated from the REST controllers and domain model.

The next production seams are:

1. Replace the in-memory catalog with a Git synchronizer and durable read model.
2. Implement `ExecutionRunner` with an Ansible client that submits a pinned commit, environment, and scenario IDs to the Windows worker.
3. Persist executions and runner callbacks so queued/running history survives restarts.
4. Add authentication and authorization around source/environment access.
