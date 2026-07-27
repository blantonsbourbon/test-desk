package com.acme.testdesk.service;

import com.acme.testdesk.domain.CatalogEntry;
import com.acme.testdesk.domain.Environment;
import com.acme.testdesk.domain.ExecutionOrigin;
import com.acme.testdesk.domain.ExecutionProfile;
import com.acme.testdesk.domain.ExecutionStatus;
import com.acme.testdesk.domain.TestExecution;
import com.acme.testdesk.domain.TestSource;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class ExecutionService {
    private final CatalogService catalogService;
    private final ExecutionProfileRegistry profileRegistry;
    private final ExecutionOrchestrator orchestrator;
    private final ConcurrentMap<String, TestExecution> executions = new ConcurrentHashMap<>();

    public ExecutionService(
            CatalogService catalogService,
            ExecutionProfileRegistry profileRegistry,
            ExecutionOrchestrator orchestrator
    ) {
        this.catalogService = catalogService;
        this.profileRegistry = profileRegistry;
        this.orchestrator = orchestrator;
    }

    public TestExecution create(
            String sourceId,
            List<String> entryIds,
            Environment environment,
            String revisionCommit,
            ExecutionOrigin origin
    ) {
        if (sourceId == null || sourceId.isBlank()) {
            throw new InvalidExecutionException("sourceId is required");
        }
        if (environment == null) {
            throw new InvalidExecutionException("environment is required and must be dev or qa");
        }

        TestSource source = catalogService.getSource(sourceId);
        if (source.latestRevision() == null) {
            throw new InvalidExecutionException("Test Source has no Catalog Revision available");
        }
        if (revisionCommit != null
                && !revisionCommit.isBlank()
                && !source.latestRevision().commit().equals(revisionCommit)) {
            throw new InvalidExecutionException("Catalog revision is stale; refresh the catalog and try again");
        }

        List<CatalogEntry> selected = catalogService.getEntries(entryIds);
        boolean belongsToSource = selected.stream().allMatch(entry -> entry.sourceId().equals(sourceId));
        if (!belongsToSource) {
            throw new InvalidExecutionException("All Catalog Entries must belong to source: " + sourceId);
        }
        ExecutionProfile profile = profileRegistry.resolve(selected, environment);

        TestExecution execution = new TestExecution(
                UUID.randomUUID().toString(),
                sourceId,
                source.latestRevision(),
                environment,
                "local-user",
                origin == null ? ExecutionOrigin.REST_API : origin,
                profile.id(),
                selected
        );
        executions.put(execution.id(), execution);
        orchestrator.start(execution, this::recordTerminalResult);
        return execution;
    }

    public List<TestExecution> list(
            String sourceId,
            ExecutionStatus status,
            Environment environment,
            Instant from,
            Instant to
    ) {
        return executions.values().stream()
                .filter(execution -> sourceId == null || sourceId.isBlank() || execution.sourceId().equals(sourceId))
                .filter(execution -> status == null || execution.status() == status)
                .filter(execution -> environment == null || execution.environment() == environment)
                .filter(execution -> from == null || !execution.requestedAt().isBefore(from))
                .filter(execution -> to == null || !execution.requestedAt().isAfter(to))
                .sorted(Comparator.comparing(TestExecution::requestedAt).reversed())
                .toList();
    }

    public TestExecution get(String executionId) {
        TestExecution execution = executions.get(executionId);
        if (execution == null) {
            throw new ResourceNotFoundException("Test Execution not found: " + executionId);
        }
        return execution;
    }

    public TestExecution cancel(String executionId) {
        TestExecution execution = get(executionId);
        orchestrator.cancel(execution, this::recordTerminalResult);
        return execution;
    }

    public List<TestExecution> recentForEntry(String entryId, int limit) {
        catalogService.getEntry(entryId);
        int safeLimit = Math.max(1, Math.min(limit, 5));
        return executions.values().stream()
                .filter(execution -> execution.results().stream()
                        .anyMatch(result -> result.entryId().equals(entryId)))
                .sorted(Comparator.comparing(TestExecution::requestedAt).reversed())
                .limit(safeLimit)
                .toList();
    }

    private void recordTerminalResult(TestExecution execution) {
        if (execution.status().isTerminal()) {
            catalogService.recordExecution(execution);
        }
    }
}
