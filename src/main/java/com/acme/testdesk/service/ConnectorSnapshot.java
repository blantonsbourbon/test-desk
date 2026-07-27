package com.acme.testdesk.service;

import com.acme.testdesk.domain.ExecutionStatus;
import com.acme.testdesk.domain.TestExecution;

import java.util.Map;

public record ConnectorSnapshot(
        ExecutionStatus status,
        Map<String, TestExecution.ResultUpdate> results,
        String errorMessage
) {
    public ConnectorSnapshot {
        results = Map.copyOf(results);
    }
}
