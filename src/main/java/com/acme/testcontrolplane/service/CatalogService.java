package com.acme.testcontrolplane.service;

import com.acme.testcontrolplane.api.ApiModels;
import com.acme.testcontrolplane.domain.CatalogRevision;
import com.acme.testcontrolplane.domain.FeatureDefinition;
import com.acme.testcontrolplane.domain.ScenarioDefinition;
import com.acme.testcontrolplane.domain.ScenarioExecutionStatus;
import com.acme.testcontrolplane.domain.ScenarioKind;
import com.acme.testcontrolplane.domain.ScenarioStep;
import com.acme.testcontrolplane.domain.SourceSyncStatus;
import com.acme.testcontrolplane.domain.TestExecution;
import com.acme.testcontrolplane.domain.TestSource;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class CatalogService {
    private final ConcurrentMap<String, TestSource> sources = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, FeatureDefinition> features = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, ScenarioDefinition> scenarios = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, LatestScenarioResult> latestResults = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler;

    public CatalogService(ScheduledExecutorService scheduler) {
        this.scheduler = scheduler;
        seedCatalog();
    }

    public List<TestSource> listSources() {
        return sources.values().stream()
                .sorted(Comparator.comparing(TestSource::name))
                .toList();
    }

    public TestSource getSource(String sourceId) {
        TestSource source = sources.get(sourceId);
        if (source == null) {
            throw new ResourceNotFoundException("Test Source not found: " + sourceId);
        }
        return source;
    }

    public CatalogSnapshot getCatalog(String sourceId, String query, String status, List<String> tags) {
        TestSource source = getSource(sourceId);
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        List<String> normalizedTags = tags == null ? List.of() : tags.stream()
                .filter(Objects::nonNull)
                .map(tag -> tag.trim().toLowerCase(Locale.ROOT))
                .filter(tag -> !tag.isBlank())
                .toList();

        List<FeatureDefinition> matchingFeatures = features.values().stream()
                .filter(feature -> feature.sourceId().equals(sourceId))
                .sorted(Comparator.comparing(FeatureDefinition::name))
                .map(feature -> filterFeature(feature, normalizedQuery, normalizedStatus, normalizedTags))
                .filter(feature -> !feature.scenarios().isEmpty())
                .toList();

        long passedCount = matchingFeatures.stream()
                .flatMap(feature -> feature.scenarios().stream())
                .map(this::latestStatus)
                .filter(statusValue -> statusValue == ScenarioExecutionStatus.PASSED)
                .count();
        long failedCount = matchingFeatures.stream()
                .flatMap(feature -> feature.scenarios().stream())
                .map(this::latestStatus)
                .filter(statusValue -> statusValue == ScenarioExecutionStatus.FAILED)
                .count();

        return new CatalogSnapshot(
                source,
                matchingFeatures,
                new ApiModels.CatalogStats(
                        matchingFeatures.size(),
                        matchingFeatures.stream().mapToInt(feature -> feature.scenarios().size()).sum(),
                        passedCount,
                        failedCount
                )
        );
    }

    public ScenarioDefinition getScenario(String scenarioId) {
        ScenarioDefinition scenario = scenarios.get(scenarioId);
        if (scenario == null) {
            throw new ResourceNotFoundException("Scenario not found: " + scenarioId);
        }
        return scenario;
    }

    public List<ScenarioDefinition> getScenarios(Collection<String> scenarioIds) {
        if (scenarioIds == null || scenarioIds.isEmpty()) {
            throw new InvalidExecutionException("At least one scenario is required");
        }
        List<ScenarioDefinition> selected = scenarioIds.stream()
                .distinct()
                .map(this::getScenario)
                .toList();
        String firstFeatureId = selected.get(0).featureId();
        String actualSourceId = getFeature(firstFeatureId).sourceId();
        boolean sameSource = selected.stream()
                .map(ScenarioDefinition::featureId)
                .map(this::getFeature)
                .allMatch(feature -> feature.sourceId().equals(actualSourceId));
        if (!sameSource) {
            throw new InvalidExecutionException("All scenarios in one execution must belong to the same Test Source");
        }
        return selected;
    }

    public FeatureDefinition getFeature(String featureId) {
        FeatureDefinition feature = features.get(featureId);
        if (feature == null) {
            throw new ResourceNotFoundException("Feature not found: " + featureId);
        }
        return feature;
    }

    public List<FeatureDefinition> getFeaturesForSource(String sourceId) {
        getSource(sourceId);
        return features.values().stream()
                .filter(feature -> feature.sourceId().equals(sourceId))
                .sorted(Comparator.comparing(FeatureDefinition::name))
                .toList();
    }

    public ScenarioStatus latestScenarioStatus(String scenarioId) {
        LatestScenarioResult latest = latestResults.get(scenarioId);
        return latest == null
                ? new ScenarioStatus(null, null, null)
                : new ScenarioStatus(latest.status(), latest.durationMs(), latest.completedAt());
    }

    public List<String> tagsForSource(String sourceId) {
        return getFeaturesForSource(sourceId).stream()
                .flatMap(feature -> feature.scenarios().stream())
                .flatMap(scenario -> scenario.tags().stream())
                .distinct()
                .sorted()
                .toList();
    }

    public void recordExecution(TestExecution execution) {
        Instant completedAt = execution.completedAt() == null ? Instant.now() : execution.completedAt();
        execution.results().forEach(result -> latestResults.put(
                result.scenarioId(),
                new LatestScenarioResult(result.status(), result.durationMs(), completedAt)
        ));
    }

    public void requestSync(String sourceId) {
        TestSource source = getSource(sourceId);
        source.markSyncing();
        scheduler.schedule(() -> source.markSynced(nextCommit(source.latestRevision().commit())), 350, TimeUnit.MILLISECONDS);
    }

    private FeatureDefinition filterFeature(
            FeatureDefinition feature,
            String query,
            String status,
            List<String> tags
    ) {
        List<ScenarioDefinition> matchingScenarios = feature.scenarios().stream()
                .filter(scenario -> matchesQuery(feature, scenario, query))
                .filter(scenario -> matchesStatus(scenario, status))
                .filter(scenario -> tags.isEmpty() || tags.stream().allMatch(tag -> scenario.tags().stream()
                        .map(value -> value.toLowerCase(Locale.ROOT)).toList().contains(tag)))
                .toList();
        return new FeatureDefinition(
                feature.id(), feature.sourceId(), feature.name(), feature.tags(), feature.sourcePath(), matchingScenarios);
    }

    private boolean matchesQuery(FeatureDefinition feature, ScenarioDefinition scenario, String query) {
        if (query.isBlank()) {
            return true;
        }
        return String.join(" ", feature.name(), scenario.name(), scenario.sourcePath(), String.join(" ", scenario.tags()))
                .toLowerCase(Locale.ROOT)
                .contains(query);
    }

    private boolean matchesStatus(ScenarioDefinition scenario, String status) {
        if (status.isBlank() || status.equals("ALL")) {
            return true;
        }
        ScenarioExecutionStatus latest = latestStatus(scenario);
        return status.equals("NEVER_RUN") ? latest == null : latest != null && latest.name().equals(status);
    }

    private ScenarioExecutionStatus latestStatus(ScenarioDefinition scenario) {
        LatestScenarioResult latest = latestResults.get(scenario.id());
        return latest == null ? null : latest.status();
    }

    private void seedCatalog() {
        Instant syncedAt = Instant.parse("2026-07-21T02:10:00Z");
        TestSource source = new TestSource(
                "checkout-web",
                "Checkout web",
                "acme/checkout-web-e2e",
                "main",
                new CatalogRevision("a13f9c2", "main", syncedAt),
                SourceSyncStatus.SYNCED
        );
        sources.put(source.id(), source);

        addFeature(new FeatureDefinition(
                "checkout-payments",
                source.id(),
                "Checkout payments",
                List.of("critical", "payments"),
                "features/checkout/payments.feature",
                List.of(
                        scenario("checkout-valid-card", "checkout-payments", "Customer completes checkout with a valid card", ScenarioKind.SCENARIO, List.of("smoke", "payments"), 18,
                                List.of(step("Given", "a customer has an item in the cart"), step("When", "they pay with a valid card"), step("Then", "the order confirmation is shown"))),
                        scenario("checkout-expired-card", "checkout-payments", "Customer sees a message for an expired card", ScenarioKind.SCENARIO, List.of("payments", "regression"), 33,
                                List.of(step("Given", "a customer is on the payment step"), step("When", "they submit an expired card"), step("Then", "a useful decline message is shown"))),
                        scenario("checkout-wallet", "checkout-payments", "Customer pays with a saved wallet", ScenarioKind.SCENARIO_OUTLINE, List.of("payments"), 47,
                                List.of(step("Given", "a customer has a saved wallet"), step("When", "they choose <wallet>"), step("Then", "the payment is accepted")))
                )
        ));
        addFeature(new FeatureDefinition(
                "checkout-cart",
                source.id(),
                "Cart management",
                List.of("smoke", "cart"),
                "features/checkout/cart.feature",
                List.of(
                        scenario("cart-add-item", "checkout-cart", "Customer adds a product to the cart", ScenarioKind.SCENARIO, List.of("smoke", "cart"), 11,
                                List.of(step("Given", "a product is available"), step("When", "the customer adds it to the cart"), step("Then", "the cart contains one item"))),
                        scenario("cart-update-quantity", "checkout-cart", "Customer updates item quantity", ScenarioKind.SCENARIO, List.of("cart"), 25,
                                List.of(step("Given", "the cart contains one item"), step("When", "the customer changes its quantity"), step("Then", "the total is recalculated")))
                )
        ));
        addFeature(new FeatureDefinition(
                "account-sign-in",
                source.id(),
                "Account sign-in",
                List.of("smoke", "account"),
                "features/account/sign-in.feature",
                List.of(
                        scenario("account-valid-login", "account-sign-in", "Customer signs in with valid credentials", ScenarioKind.SCENARIO, List.of("smoke", "account"), 9,
                                List.of(step("Given", "a registered customer is on the sign-in page"), step("When", "they submit valid credentials"), step("Then", "the account home is shown"))),
                        scenario("account-invalid-login", "account-sign-in", "Customer sees an error for invalid credentials", ScenarioKind.SCENARIO, List.of("account", "regression"), 23,
                                List.of(step("Given", "a registered customer is on the sign-in page"), step("When", "they submit invalid credentials"), step("Then", "an authentication error is shown")))
                )
        ));
        addFeature(new FeatureDefinition(
                "orders-history",
                source.id(),
                "Order history",
                List.of("regression", "orders"),
                "features/orders/history.feature",
                List.of(
                        scenario("orders-history-list", "orders-history", "Customer can review recent orders", ScenarioKind.SCENARIO, List.of("orders"), 12,
                                List.of(step("Given", "a customer has completed orders"), step("When", "they open order history"), step("Then", "recent orders are listed"))),
                        scenario("orders-history-filter", "orders-history", "Customer filters order history by status", ScenarioKind.SCENARIO, List.of("orders", "regression"), 29,
                                List.of(step("Given", "a customer has orders in multiple states"), step("When", "they filter by shipped"), step("Then", "only shipped orders are shown")))
                )
        ));
    }

    private void addFeature(FeatureDefinition feature) {
        features.put(feature.id(), feature);
        feature.scenarios().forEach(scenario -> scenarios.put(scenario.id(), scenario));
    }

    private ScenarioDefinition scenario(
            String id,
            String featureId,
            String name,
            ScenarioKind kind,
            List<String> tags,
            int line,
            List<ScenarioStep> steps
    ) {
        return new ScenarioDefinition(id, featureId, name, kind, tags, featurePath(featureId), line, steps);
    }

    private String featurePath(String featureId) {
        return switch (featureId) {
            case "checkout-payments" -> "features/checkout/payments.feature";
            case "checkout-cart" -> "features/checkout/cart.feature";
            case "account-sign-in" -> "features/account/sign-in.feature";
            case "orders-history" -> "features/orders/history.feature";
            default -> "features/unknown.feature";
        };
    }

    private ScenarioStep step(String keyword, String text) {
        return new ScenarioStep(keyword, text);
    }

    private String nextCommit(String currentCommit) {
        return currentCommit.equals("a13f9c2") ? "b27e4ad" : "a13f9c2";
    }

    public record CatalogSnapshot(TestSource source, List<FeatureDefinition> features, ApiModels.CatalogStats stats) {
    }

    public record ScenarioStatus(ScenarioExecutionStatus status, Long durationMs, Instant lastRunAt) {
    }

    private record LatestScenarioResult(ScenarioExecutionStatus status, long durationMs, Instant completedAt) {
    }
}
