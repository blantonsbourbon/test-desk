package com.acme.testcontrolplane.domain;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CopyOnWriteArrayList;

public final class TestExecution {
    private final String id;
    private final String sourceId;
    private final CatalogRevision revision;
    private final Environment environment;
    private final String requestedBy;
    private final Instant requestedAt;
    private final List<ScenarioExecutionResult> results;
    private volatile ExecutionStatus status;
    private volatile Instant startedAt;
    private volatile Instant completedAt;
    private volatile String errorMessage;

    public TestExecution(
            String id,
            String sourceId,
            CatalogRevision revision,
            Environment environment,
            String requestedBy,
            List<ScenarioDefinition> scenarios
    ) {
        this.id = Objects.requireNonNull(id);
        this.sourceId = Objects.requireNonNull(sourceId);
        this.revision = Objects.requireNonNull(revision);
        this.environment = Objects.requireNonNull(environment);
        this.requestedBy = Objects.requireNonNull(requestedBy);
        this.requestedAt = Instant.now();
        this.status = ExecutionStatus.QUEUED;
        this.results = new CopyOnWriteArrayList<>(scenarios.stream()
                .map(scenario -> new ScenarioExecutionResult(
                        scenario.id(),
                        scenario.name(),
                        ScenarioExecutionStatus.QUEUED,
                        0,
                        null
                ))
                .toList());
    }

    public String id() {
        return id;
    }

    public String sourceId() {
        return sourceId;
    }

    public CatalogRevision revision() {
        return revision;
    }

    public Environment environment() {
        return environment;
    }

    public String requestedBy() {
        return requestedBy;
    }

    public Instant requestedAt() {
        return requestedAt;
    }

    public ExecutionStatus status() {
        return status;
    }

    public Instant startedAt() {
        return startedAt;
    }

    public Instant completedAt() {
        return completedAt;
    }

    public String errorMessage() {
        return errorMessage;
    }

    public List<ScenarioExecutionResult> results() {
        return List.copyOf(results);
    }

    public synchronized void markRunning() {
        if (status != ExecutionStatus.QUEUED) {
            return;
        }
        startedAt = Instant.now();
        status = ExecutionStatus.RUNNING;
        replaceResults(ScenarioExecutionStatus.RUNNING, 0, null);
    }

    public synchronized void complete(Map<String, ScenarioResultUpdate> updates) {
        if (status.isTerminal()) {
            return;
        }

        List<ScenarioExecutionResult> updated = new ArrayList<>();
        boolean hasError = false;
        boolean hasFailure = false;
        for (ScenarioExecutionResult result : results) {
            ScenarioResultUpdate update = updates.get(result.scenarioId());
            ScenarioExecutionStatus scenarioStatus = update == null
                    ? ScenarioExecutionStatus.ERROR
                    : update.status();
            long durationMs = update == null ? 0 : update.durationMs();
            String message = update == null ? "Runner returned no result for this scenario" : update.errorMessage();
            updated.add(new ScenarioExecutionResult(
                    result.scenarioId(), result.scenarioName(), scenarioStatus, durationMs, message));
            hasError |= scenarioStatus == ScenarioExecutionStatus.ERROR;
            hasFailure |= scenarioStatus == ScenarioExecutionStatus.FAILED;
        }
        results.clear();
        results.addAll(updated);
        status = hasError ? ExecutionStatus.ERROR : hasFailure ? ExecutionStatus.FAILED : ExecutionStatus.PASSED;
        completedAt = Instant.now();
    }

    public synchronized void markRunnerError(String message) {
        if (status.isTerminal()) {
            return;
        }
        errorMessage = message;
        status = ExecutionStatus.ERROR;
        completedAt = Instant.now();
        replaceResults(ScenarioExecutionStatus.ERROR, 0, message);
    }

    public synchronized boolean cancel() {
        if (status.isTerminal()) {
            return false;
        }
        status = ExecutionStatus.CANCELLED;
        completedAt = Instant.now();
        replaceResults(ScenarioExecutionStatus.CANCELLED, 0, "Cancelled by user");
        return true;
    }

    public long durationMs() {
        Instant end = completedAt == null ? Instant.now() : completedAt;
        Instant start = startedAt == null ? requestedAt : startedAt;
        return Math.max(0, Duration.between(start, end).toMillis());
    }

    private void replaceResults(ScenarioExecutionStatus scenarioStatus, long durationMs, String message) {
        List<ScenarioExecutionResult> updated = results.stream()
                .map(result -> new ScenarioExecutionResult(
                        result.scenarioId(), result.scenarioName(), scenarioStatus, durationMs, message))
                .toList();
        results.clear();
        results.addAll(updated);
    }

    public record ScenarioResultUpdate(
            ScenarioExecutionStatus status,
            long durationMs,
            String errorMessage
    ) {
    }
}
