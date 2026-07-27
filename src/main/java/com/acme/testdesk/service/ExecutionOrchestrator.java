package com.acme.testdesk.service;

import com.acme.testdesk.domain.ExecutionProfile;
import com.acme.testdesk.domain.ExecutionStatus;
import com.acme.testdesk.domain.ExternalExecution;
import com.acme.testdesk.domain.TestExecution;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
public class ExecutionOrchestrator {
    private static final long POLL_DELAY_MS = 150;

    private final ExecutionProfileRegistry profileRegistry;
    private final Map<String, ExecutionConnector> connectors;
    private final ScheduledExecutorService scheduler;

    public ExecutionOrchestrator(
            ExecutionProfileRegistry profileRegistry,
            List<ExecutionConnector> connectors,
            ScheduledExecutorService scheduler
    ) {
        this.profileRegistry = profileRegistry;
        this.connectors = connectors.stream().collect(Collectors.toUnmodifiableMap(
                ExecutionConnector::id,
                Function.identity()));
        this.scheduler = scheduler;
    }

    public void start(TestExecution execution, Consumer<TestExecution> onUpdate) {
        try {
            ExecutionProfile profile = profileRegistry.get(execution.profileId());
            ExecutionConnector connector = connector(profile.connectorId());
            DispatchCommand command = commandFor(execution);
            ExternalExecution externalExecution = connector.submit(command);
            execution.attachExternalExecution(externalExecution);
            schedulePoll(execution, command, connector, onUpdate, POLL_DELAY_MS);
        } catch (RuntimeException exception) {
            execution.markRunnerError("Execution connector unavailable");
            onUpdate.accept(execution);
        }
    }

    public void cancel(TestExecution execution, Consumer<TestExecution> onUpdate) {
        ExternalExecution externalExecution = execution.externalExecution();
        if (externalExecution != null) {
            ExecutionProfile profile = profileRegistry.get(execution.profileId());
            connector(profile.connectorId()).cancel(commandFor(execution), externalExecution);
        }
        if (execution.cancel()) {
            onUpdate.accept(execution);
        }
    }

    private void schedulePoll(
            TestExecution execution,
            DispatchCommand command,
            ExecutionConnector connector,
            Consumer<TestExecution> onUpdate,
            long delayMs
    ) {
        scheduler.schedule(() -> poll(execution, command, connector, onUpdate), delayMs, TimeUnit.MILLISECONDS);
    }

    private void poll(
            TestExecution execution,
            DispatchCommand command,
            ExecutionConnector connector,
            Consumer<TestExecution> onUpdate
    ) {
        if (execution.status().isTerminal()) {
            return;
        }
        try {
            ConnectorSnapshot snapshot = connector.inspect(command, execution.externalExecution());
            if (snapshot.status() == ExecutionStatus.RUNNING) {
                execution.markRunning();
                onUpdate.accept(execution);
                schedulePoll(execution, command, connector, onUpdate, POLL_DELAY_MS);
                return;
            }
            if (snapshot.status() == ExecutionStatus.QUEUED) {
                schedulePoll(execution, command, connector, onUpdate, POLL_DELAY_MS);
                return;
            }
            if (snapshot.status() == ExecutionStatus.ERROR) {
                execution.markRunnerError(snapshot.errorMessage());
            } else if (snapshot.status() == ExecutionStatus.CANCELLED) {
                execution.cancel();
            } else {
                execution.complete(snapshot.results());
            }
            onUpdate.accept(execution);
        } catch (RuntimeException exception) {
            execution.markRunnerError("Execution observation failed");
            onUpdate.accept(execution);
        }
    }

    private ExecutionConnector connector(String connectorId) {
        ExecutionConnector connector = connectors.get(connectorId);
        if (connector == null) {
            throw new InvalidExecutionException("Execution Connector not found: " + connectorId);
        }
        return connector;
    }

    private DispatchCommand commandFor(TestExecution execution) {
        return new DispatchCommand(
                execution.id(),
                execution.sourceId(),
                execution.revision(),
                execution.environment(),
                execution.profileId(),
                execution.entries().stream()
                        .map(entry -> new ExecutionEntrySelection(
                                entry.id(),
                                entry.name(),
                                entry.testType(),
                                entry.framework(),
                                entry.definitionKind(),
                                entry.selectionRef()))
                        .toList(),
                execution.results().stream().map(result -> result.resultId()).toList());
    }
}
