package com.acme.testcontrolplane.domain;

public enum ScenarioExecutionStatus {
    QUEUED,
    RUNNING,
    PASSED,
    FAILED,
    ERROR,
    CANCELLED,
    SKIPPED;
}
