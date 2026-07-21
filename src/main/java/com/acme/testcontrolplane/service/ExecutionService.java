package com.acme.testcontrolplane.service;

import com.acme.testcontrolplane.domain.Environment;
import com.acme.testcontrolplane.domain.ExecutionStatus;
import com.acme.testcontrolplane.domain.ScenarioDefinition;
import com.acme.testcontrolplane.domain.TestExecution;
import com.acme.testcontrolplane.domain.TestSource;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class ExecutionService {
    private final CatalogService catalogService;
    private final ExecutionRunner executionRunner;
    private final ConcurrentMap<String, TestExecution> executions = new ConcurrentHashMap<>();

    public ExecutionService(CatalogService catalogService, ExecutionRunner executionRunner) {
        this.catalogService = catalogService;
        this.executionRunner = executionRunner;
    }

    public TestExecution create(String sourceId, List<String> scenarioIds, Environment environment) {
        if (sourceId == null || sourceId.isBlank()) {
            throw new InvalidExecutionException("sourceId is required");
        }
        if (environment == null) {
            throw new InvalidExecutionException("environment is required and must be dev or qa");
        }

        TestSource source = catalogService.getSource(sourceId);
        List<ScenarioDefinition> selected = catalogService.getScenarios(scenarioIds);
        boolean belongsToSource = selected.stream()
                .map(ScenarioDefinition::featureId)
                .map(catalogService::getFeature)
                .allMatch(feature -> feature.sourceId().equals(sourceId));
        if (!belongsToSource) {
            throw new InvalidExecutionException("All scenarios must belong to source: " + sourceId);
        }
        if (source.latestRevision() == null) {
            throw new InvalidExecutionException("Test Source has no Catalog Revision available");
        }

        TestExecution execution = new TestExecution(
                UUID.randomUUID().toString(),
                sourceId,
                source.latestRevision(),
                environment,
                "local-user",
                selected
        );
        executions.put(execution.id(), execution);
        try {
            executionRunner.submit(execution, this::recordTerminalResult);
        } catch (RuntimeException exception) {
            execution.markRunnerError("Execution runner unavailable");
            catalogService.recordExecution(execution);
        }
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
        if (execution.cancel()) {
            catalogService.recordExecution(execution);
        }
        return execution;
    }

    public List<TestExecution> recentForScenario(String scenarioId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return executions.values().stream()
                .filter(execution -> execution.results().stream()
                        .anyMatch(result -> result.scenarioId().equals(scenarioId)))
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
