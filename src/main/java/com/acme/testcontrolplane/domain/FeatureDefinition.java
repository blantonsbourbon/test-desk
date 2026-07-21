package com.acme.testcontrolplane.domain;

import java.util.List;

public record FeatureDefinition(
        String id,
        String sourceId,
        String name,
        List<String> tags,
        String sourcePath,
        List<ScenarioDefinition> scenarios
) {
    public FeatureDefinition {
        tags = List.copyOf(tags);
        scenarios = List.copyOf(scenarios);
    }
}
