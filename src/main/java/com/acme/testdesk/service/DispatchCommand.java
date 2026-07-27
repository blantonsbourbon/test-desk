package com.acme.testdesk.service;

import com.acme.testdesk.domain.CatalogRevision;
import com.acme.testdesk.domain.Environment;

import java.util.List;

public record DispatchCommand(
        String executionId,
        String sourceId,
        CatalogRevision revision,
        Environment environment,
        String profileId,
        List<ExecutionEntrySelection> entries,
        List<String> resultIds
) {
    public DispatchCommand {
        entries = List.copyOf(entries);
        resultIds = List.copyOf(resultIds);
    }
}
