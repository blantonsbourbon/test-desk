package com.acme.testdesk.service;

import com.acme.testdesk.domain.CatalogEntry;
import com.acme.testdesk.domain.Environment;
import com.acme.testdesk.domain.ExecutionProfile;
import com.acme.testdesk.domain.TestType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class ExecutionProfileRegistry {
    private final Map<String, ExecutionProfile> profiles;

    public ExecutionProfileRegistry() {
        List<ExecutionProfile> configured = List.of(
                new ExecutionProfile(
                        "bdd-cucumber-simulation",
                        TestType.BDD,
                        "cucumber",
                        "simulation",
                        Set.of(Environment.DEV, Environment.QA))
        );
        this.profiles = configured.stream().collect(Collectors.toUnmodifiableMap(
                ExecutionProfile::id,
                Function.identity()));
    }

    public ExecutionProfile resolve(List<CatalogEntry> entries, Environment environment) {
        return profiles.values().stream()
                .filter(profile -> entries.stream().allMatch(entry -> profile.supports(entry, environment)))
                .findFirst()
                .orElseThrow(() -> new InvalidExecutionException(
                        "No Execution Profile supports the selected entries in environment: " + environment.jsonValue()));
    }

    public ExecutionProfile get(String profileId) {
        ExecutionProfile profile = profiles.get(profileId);
        if (profile == null) {
            throw new InvalidExecutionException("Execution Profile not found: " + profileId);
        }
        return profile;
    }
}
