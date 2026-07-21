package com.acme.testcontrolplane.domain;

import java.util.List;
import java.util.Map;

public record ScenarioDefinition(
        String id,
        String featureId,
        String name,
        ScenarioKind kind,
        List<String> tags,
        String sourcePath,
        int line,
        List<ScenarioStep> steps,
        List<Map<String, String>> examples
) {
    public ScenarioDefinition(
            String id,
            String featureId,
            String name,
            ScenarioKind kind,
            List<String> tags,
            String sourcePath,
            int line,
            List<ScenarioStep> steps
    ) {
        this(id, featureId, name, kind, tags, sourcePath, line, steps, List.of());
    }

    public ScenarioDefinition {
        tags = List.copyOf(tags);
        steps = List.copyOf(steps);
        examples = examples.stream().map(Map::copyOf).toList();
    }
}
