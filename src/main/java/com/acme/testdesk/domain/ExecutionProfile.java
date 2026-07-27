package com.acme.testdesk.domain;

import java.util.Set;

public record ExecutionProfile(
        String id,
        TestType testType,
        String framework,
        String connectorId,
        Set<Environment> environments
) {
    public ExecutionProfile {
        environments = Set.copyOf(environments);
    }

    public boolean supports(CatalogEntry entry, Environment environment) {
        return testType == entry.testType()
                && framework.equalsIgnoreCase(entry.framework())
                && environments.contains(environment);
    }
}
