package com.acme.testdesk.service;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@Configuration
public class ExecutionSchedulerConfiguration {

    @Bean(destroyMethod = "shutdownNow")
    ScheduledExecutorService executionScheduler() {
        return Executors.newScheduledThreadPool(2, runnable -> {
            Thread thread = new Thread(runnable, "test-execution-orchestrator");
            thread.setDaemon(true);
            return thread;
        });
    }
}
