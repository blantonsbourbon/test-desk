package com.acme.testdesk.domain;

import java.util.List;
import java.util.Map;

public record BddCatalogEntryDetails(
        List<BddStep> steps,
        List<Map<String, String>> examples
) implements CatalogEntryDetails {
    public BddCatalogEntryDetails {
        steps = List.copyOf(steps);
        examples = examples.stream().map(Map::copyOf).toList();
    }
}
