package com.acme.testcontrolplane.domain;

public record ScenarioExecutionResult(
        String scenarioId,
        String scenarioName,
        ScenarioExecutionStatus status,
        long durationMs,
        String errorMessage
) {
}
