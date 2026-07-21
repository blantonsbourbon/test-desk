package com.acme.testcontrolplane.service;

import com.acme.testcontrolplane.domain.ScenarioExecutionStatus;
import com.acme.testcontrolplane.domain.TestExecution;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/**
 * Temporary runner adapter used until the Ansible/Windows integration is wired.
 * The REST contract talks to the ExecutionRunner port, so replacing this adapter
 * does not change catalog or execution APIs.
 */
@Primary
@Component
public class SimulationExecutionRunner implements ExecutionRunner {
    private final ScheduledExecutorService scheduler;

    public SimulationExecutionRunner(ScheduledExecutorService scheduler) {
        this.scheduler = scheduler;
    }

    @Override
    public void submit(TestExecution execution, Consumer<TestExecution> onUpdate) {
        scheduler.schedule(() -> {
            execution.markRunning();
            onUpdate.accept(execution);
        }, 150, TimeUnit.MILLISECONDS);
        scheduler.schedule(() -> {
            if (execution.status().isTerminal()) {
                return;
            }
            Map<String, TestExecution.ScenarioResultUpdate> updates = new HashMap<>();
            execution.results().forEach(result -> {
                boolean deterministicFailure = result.scenarioId().contains("expired");
                updates.put(result.resultId(), new TestExecution.ScenarioResultUpdate(
                        deterministicFailure ? ScenarioExecutionStatus.FAILED : ScenarioExecutionStatus.PASSED,
                        deterministicFailure ? 820 : 1320,
                        deterministicFailure ? "Expected payment rejection message was not visible" : null
                ));
            });
            execution.complete(updates);
            onUpdate.accept(execution);
        }, 900, TimeUnit.MILLISECONDS);
    }
}
