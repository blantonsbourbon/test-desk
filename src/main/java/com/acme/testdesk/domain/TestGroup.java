package com.acme.testdesk.domain;

import java.util.List;

public record TestGroup(
        String id,
        String sourceId,
        String name,
        TestGroupKind kind,
        List<String> tags,
        String sourcePath,
        List<CatalogEntry> entries
) {
    public TestGroup {
        tags = List.copyOf(tags);
        entries = List.copyOf(entries);
    }
}
