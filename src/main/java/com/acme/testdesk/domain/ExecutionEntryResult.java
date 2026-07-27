package com.acme.testdesk.domain;

import java.util.Map;

public record ExecutionEntryResult(
        String resultId,
        String entryId,
        String entryName,
        String caseId,
        Map<String, String> caseValues,
        TestResultStatus status,
        long durationMs,
        String errorMessage
) {
    public ExecutionEntryResult {
        caseValues = Map.copyOf(caseValues);
    }
}
