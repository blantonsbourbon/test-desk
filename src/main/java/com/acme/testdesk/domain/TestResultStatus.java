package com.acme.testdesk.domain;

public enum TestResultStatus {
    QUEUED,
    RUNNING,
    PASSED,
    FAILED,
    ERROR,
    CANCELLED,
    SKIPPED;
}
