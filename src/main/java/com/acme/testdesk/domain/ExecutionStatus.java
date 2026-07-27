package com.acme.testdesk.domain;

public enum ExecutionStatus {
    QUEUED,
    RUNNING,
    PASSED,
    FAILED,
    ERROR,
    CANCELLED;

    public boolean isTerminal() {
        return switch (this) {
            case PASSED, FAILED, ERROR, CANCELLED -> true;
            case QUEUED, RUNNING -> false;
        };
    }
}
