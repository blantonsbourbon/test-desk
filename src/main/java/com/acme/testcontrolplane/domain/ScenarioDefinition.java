package com.acme.testcontrolplane.domain;

import java.util.List;

public record ScenarioDefinition(
        String id,
        String featureId,
        String name,
        ScenarioKind kind,
        List<String> tags,
        String sourcePath,
        int line,
        List<ScenarioStep> steps
) {
    public ScenarioDefinition {
        tags = List.copyOf(tags);
        steps = List.copyOf(steps);
    }
}
