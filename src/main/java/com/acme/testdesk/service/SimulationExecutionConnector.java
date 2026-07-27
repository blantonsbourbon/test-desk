package com.acme.testdesk.service;

import com.acme.testdesk.domain.ExecutionStatus;
import com.acme.testdesk.domain.ExternalExecution;
import com.acme.testdesk.domain.TestExecution;
import com.acme.testdesk.domain.TestResultStatus;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Primary
@Component
public class SimulationExecutionConnector implements ExecutionConnector {
    private final ConcurrentMap<String, Instant> submittedAt = new ConcurrentHashMap<>();

    @Override
    public String id() {
        return "simulation";
    }

    @Override
    public ExternalExecution submit(DispatchCommand command) {
        String reference = "simulation:" + command.executionId();
        submittedAt.put(reference, Instant.now());
        return new ExternalExecution(reference, null);
    }

    @Override
    public ConnectorSnapshot inspect(DispatchCommand command, ExternalExecution externalExecution) {
        Instant startedAt = submittedAt.get(externalExecution.reference());
        if (startedAt == null) {
            return new ConnectorSnapshot(ExecutionStatus.ERROR, Map.of(), "Simulation execution was not found");
        }
        long elapsedMs = Duration.between(startedAt, Instant.now()).toMillis();
        if (elapsedMs < 700) {
            return new ConnectorSnapshot(ExecutionStatus.RUNNING, Map.of(), null);
        }

        Map<String, TestExecution.ResultUpdate> updates = command.resultIds().stream()
                .collect(java.util.stream.Collectors.toMap(
                        resultId -> resultId,
                        resultId -> new TestExecution.ResultUpdate(
                                resultId.contains("expired") ? TestResultStatus.FAILED : TestResultStatus.PASSED,
                                resultId.contains("expired") ? 820 : 1320,
                                resultId.contains("expired") ? "Expected payment rejection message was not visible" : null)));
        return new ConnectorSnapshot(ExecutionStatus.PASSED, updates, null);
    }

    @Override
    public void cancel(DispatchCommand command, ExternalExecution externalExecution) {
        submittedAt.remove(externalExecution.reference());
    }
}
