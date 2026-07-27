package com.acme.testdesk.domain;

import java.util.List;
import java.util.Map;

public record CatalogEntry(
        String id,
        String sourceId,
        String groupId,
        String name,
        TestType testType,
        String framework,
        DefinitionKind definitionKind,
        List<String> tags,
        String sourcePath,
        int line,
        String selectionRef,
        CatalogEntryDetails details
) {
    public CatalogEntry {
        tags = List.copyOf(tags);
    }

    public List<Map<String, String>> caseValues() {
        if (details instanceof BddCatalogEntryDetails bdd && !bdd.examples().isEmpty()) {
            return bdd.examples();
        }
        return List.of(Map.of());
    }
}
