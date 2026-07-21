package com.acme.testcontrolplane.domain;

import java.util.Map;

public record ScenarioExecutionResult(
        String resultId,
        String scenarioId,
        String scenarioName,
        Map<String, String> exampleValues,
        ScenarioExecutionStatus status,
        long durationMs,
        String errorMessage
) {
    public ScenarioExecutionResult(
            String resultId,
            String scenarioId,
            String scenarioName,
            ScenarioExecutionStatus status,
            long durationMs,
            String errorMessage
    ) {
        this(resultId, scenarioId, scenarioName, Map.of(), status, durationMs, errorMessage);
    }

    public ScenarioExecutionResult {
        exampleValues = Map.copyOf(exampleValues);
    }
}
