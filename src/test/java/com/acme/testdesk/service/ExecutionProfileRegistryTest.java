package com.acme.testdesk.service;

import com.acme.testdesk.domain.CatalogEntry;
import com.acme.testdesk.domain.DefinitionKind;
import com.acme.testdesk.domain.Environment;
import com.acme.testdesk.domain.GenericCatalogEntryDetails;
import com.acme.testdesk.domain.TestType;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ExecutionProfileRegistryTest {
    private final ExecutionProfileRegistry registry = new ExecutionProfileRegistry();

    @Test
    void resolvesProfileFromEntryTypeFrameworkAndEnvironment() {
        var profile = registry.resolve(List.of(entry("valid-entry", TestType.BDD, "cucumber")), Environment.QA);

        assertEquals("bdd-cucumber-simulation", profile.id());
        assertEquals("simulation", profile.connectorId());
    }

    @Test
    void rejectsAnUnsupportedFrameworkBeforeDispatch() {
        assertThrows(
                InvalidExecutionException.class,
                () -> registry.resolve(List.of(entry("api-entry", TestType.API, "postman")), Environment.QA));
    }

    private CatalogEntry entry(String id, TestType type, String framework) {
        return new CatalogEntry(
                id,
                "checkout-web",
                "group",
                id,
                type,
                framework,
                DefinitionKind.TEST,
                List.of(),
                "tests/" + id,
                1,
                "tests/" + id,
                new GenericCatalogEntryDetails(""));
    }
}
