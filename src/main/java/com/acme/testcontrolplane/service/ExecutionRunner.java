package com.acme.testcontrolplane.service;

import com.acme.testcontrolplane.domain.TestExecution;

import java.util.function.Consumer;

public interface ExecutionRunner {
    void submit(TestExecution execution, Consumer<TestExecution> onUpdate);
}
