package com.acme.testdesk.domain;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public final class TestExecution {
    private final String id;
    private final String sourceId;
    private final CatalogRevision revision;
    private final Environment environment;
    private final String requestedBy;
    private final ExecutionOrigin origin;
    private final String profileId;
    private final Instant requestedAt;
    private final List<CatalogEntry> entries;
    private volatile ExternalExecution externalExecution;
    private volatile List<ExecutionEntryResult> results;
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
            ExecutionOrigin origin,
            String profileId,
            List<CatalogEntry> entries
    ) {
        this.id = Objects.requireNonNull(id);
        this.sourceId = Objects.requireNonNull(sourceId);
        this.revision = Objects.requireNonNull(revision);
        this.environment = Objects.requireNonNull(environment);
        this.requestedBy = Objects.requireNonNull(requestedBy);
        this.origin = Objects.requireNonNull(origin);
        this.profileId = Objects.requireNonNull(profileId);
        this.requestedAt = Instant.now();
        this.entries = List.copyOf(entries);
        this.status = ExecutionStatus.QUEUED;
        this.results = initialResults(entries);
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

    public ExecutionOrigin origin() {
        return origin;
    }

    public String profileId() {
        return profileId;
    }

    public Instant requestedAt() {
        return requestedAt;
    }

    public ExternalExecution externalExecution() {
        return externalExecution;
    }

    public List<CatalogEntry> entries() {
        return entries;
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

    public List<ExecutionEntryResult> results() {
        return List.copyOf(results);
    }

    public synchronized void attachExternalExecution(ExternalExecution externalExecution) {
        if (this.externalExecution == null) {
            this.externalExecution = Objects.requireNonNull(externalExecution);
        }
    }

    public synchronized void markRunning() {
        if (status != ExecutionStatus.QUEUED) {
            return;
        }
        startedAt = Instant.now();
        status = ExecutionStatus.RUNNING;
        replaceResults(TestResultStatus.RUNNING, 0, null);
    }

    public synchronized void complete(Map<String, ResultUpdate> updates) {
        if (status.isTerminal()) {
            return;
        }
        if (status == ExecutionStatus.QUEUED) {
            markRunnerError("Execution completed before it started");
            return;
        }

        List<ExecutionEntryResult> updated = new ArrayList<>();
        boolean hasError = false;
        boolean hasFailure = false;
        boolean hasCancellation = false;
        boolean hasSkipped = false;
        for (ExecutionEntryResult result : results) {
            ResultUpdate update = updates.get(result.resultId());
            TestResultStatus resultStatus = update == null || update.status() == null
                    ? TestResultStatus.ERROR
                    : update.status();
            long durationMs = update == null ? 0 : update.durationMs();
            String message = update == null || update.status() == null
                    ? "Connector returned no valid result for this entry"
                    : update.errorMessage();
            updated.add(new ExecutionEntryResult(
                    result.resultId(),
                    result.entryId(),
                    result.entryName(),
                    result.caseId(),
                    result.caseValues(),
                    resultStatus,
                    durationMs,
                    message));
            hasError |= resultStatus == TestResultStatus.ERROR;
            hasFailure |= resultStatus == TestResultStatus.FAILED;
            hasCancellation |= resultStatus == TestResultStatus.CANCELLED;
            hasSkipped |= resultStatus == TestResultStatus.SKIPPED;
        }
        results = List.copyOf(updated);
        status = hasError ? ExecutionStatus.ERROR
                : hasFailure ? ExecutionStatus.FAILED
                : hasCancellation ? ExecutionStatus.CANCELLED
                : hasSkipped ? ExecutionStatus.FAILED
                : ExecutionStatus.PASSED;
        if (status == ExecutionStatus.ERROR) {
            errorMessage = updated.stream()
                    .map(ExecutionEntryResult::errorMessage)
                    .filter(message -> message != null && !message.isBlank())
                    .findFirst()
                    .orElse("One or more entries could not be executed");
        }
        completedAt = Instant.now();
    }

    public synchronized void markRunnerError(String message) {
        if (status.isTerminal()) {
            return;
        }
        errorMessage = message;
        status = ExecutionStatus.ERROR;
        completedAt = Instant.now();
        replaceResults(TestResultStatus.ERROR, 0, message);
    }

    public synchronized boolean cancel() {
        if (status.isTerminal()) {
            return false;
        }
        status = ExecutionStatus.CANCELLED;
        completedAt = Instant.now();
        replaceResults(TestResultStatus.CANCELLED, 0, "Cancelled by user");
        return true;
    }

    public long durationMs() {
        Instant end = completedAt;
        if (startedAt == null || end == null) {
            return 0;
        }
        return Duration.between(startedAt, end).toMillis();
    }

    private List<ExecutionEntryResult> initialResults(List<CatalogEntry> entries) {
        List<ExecutionEntryResult> initial = new ArrayList<>();
        entries.forEach(entry -> {
            List<Map<String, String>> cases = entry.caseValues();
            if (cases.size() == 1 && cases.get(0).isEmpty()) {
                initial.add(new ExecutionEntryResult(
                        entry.id(), entry.id(), entry.name(), null, Map.of(), TestResultStatus.QUEUED, 0, null));
                return;
            }
            for (int index = 0; index < cases.size(); index++) {
                initial.add(new ExecutionEntryResult(
                        entry.id() + "#case-" + (index + 1),
                        entry.id(),
                        entry.name(),
                        "case-" + (index + 1),
                        cases.get(index),
                        TestResultStatus.QUEUED,
                        0,
                        null));
            }
        });
        return List.copyOf(initial);
    }

    private void replaceResults(TestResultStatus resultStatus, long durationMs, String message) {
        results = results.stream()
                .map(result -> new ExecutionEntryResult(
                        result.resultId(),
                        result.entryId(),
                        result.entryName(),
                        result.caseId(),
                        result.caseValues(),
                        resultStatus,
                        durationMs,
                        message))
                .toList();
    }

    public record ResultUpdate(TestResultStatus status, long durationMs, String errorMessage) {
    }
}
