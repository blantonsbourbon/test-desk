package com.acme.testcontrolplane.api;

import com.acme.testcontrolplane.domain.FeatureDefinition;
import com.acme.testcontrolplane.domain.ScenarioDefinition;
import com.acme.testcontrolplane.domain.TestExecution;
import com.acme.testcontrolplane.domain.TestSource;
import com.acme.testcontrolplane.service.CatalogService;
import org.springframework.stereotype.Component;

import java.util.List;

import static com.acme.testcontrolplane.api.ApiModels.CatalogResponse;
import static com.acme.testcontrolplane.api.ApiModels.ExecutionResponse;
import static com.acme.testcontrolplane.api.ApiModels.ExecutionSummaryResponse;
import static com.acme.testcontrolplane.api.ApiModels.FeatureResponse;
import static com.acme.testcontrolplane.api.ApiModels.ScenarioDetailsResponse;
import static com.acme.testcontrolplane.api.ApiModels.ScenarioExecutionResultResponse;
import static com.acme.testcontrolplane.api.ApiModels.ScenarioStepResponse;
import static com.acme.testcontrolplane.api.ApiModels.ScenarioSummaryResponse;
import static com.acme.testcontrolplane.api.ApiModels.SourceResponse;

@Component
public class ApiMapper {
    private final CatalogService catalogService;

    public ApiMapper(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    public SourceResponse toSource(TestSource source) {
        String sourceId = source.id();
        return new SourceResponse(
                source.id(),
                source.name(),
                source.repository(),
                source.defaultBranch(),
                source.latestRevision() == null ? null : ApiModels.RevisionResponse.from(source.latestRevision()),
                source.syncStatus(),
                source.syncError(),
                catalogService.getFeaturesForSource(sourceId).size(),
                catalogService.getFeaturesForSource(sourceId).stream()
                        .mapToInt(feature -> feature.scenarios().size())
                        .sum()
        );
    }

    public CatalogResponse toCatalog(CatalogService.CatalogSnapshot snapshot) {
        return new CatalogResponse(
                toSource(snapshot.source()),
                ApiModels.RevisionResponse.from(snapshot.source().latestRevision()),
                snapshot.features().stream().map(this::toFeature).toList(),
                snapshot.stats()
        );
    }

    public FeatureResponse toFeature(FeatureDefinition feature) {
        return new FeatureResponse(
                feature.id(),
                feature.name(),
                feature.tags(),
                feature.sourcePath(),
                feature.scenarios().size(),
                feature.scenarios().stream().map(this::toScenarioSummary).toList()
        );
    }

    public ScenarioSummaryResponse toScenarioSummary(ScenarioDefinition scenario) {
        CatalogService.ScenarioStatus status = catalogService.latestScenarioStatus(scenario.id());
        return new ScenarioSummaryResponse(
                scenario.id(),
                scenario.name(),
                scenario.kind(),
                scenario.tags(),
                scenario.sourcePath(),
                scenario.line(),
                scenario.examples().size(),
                status.status(),
                status.durationMs(),
                status.lastRunAt()
        );
    }

    public ScenarioDetailsResponse toScenarioDetails(ScenarioDefinition scenario, List<TestExecution> recentExecutions) {
        CatalogService.ScenarioStatus status = catalogService.latestScenarioStatus(scenario.id());
        String featureName = catalogService.getFeature(scenario.featureId()).name();
        return new ScenarioDetailsResponse(
                scenario.id(),
                scenario.featureId(),
                featureName,
                scenario.name(),
                scenario.kind(),
                scenario.tags(),
                scenario.sourcePath(),
                scenario.line(),
                scenario.steps().stream().map(step -> new ScenarioStepResponse(step.keyword(), step.text())).toList(),
                scenario.examples(),
                status.status(),
                status.durationMs(),
                status.lastRunAt(),
                recentExecutions.stream().map(this::toExecutionSummary).toList()
        );
    }

    public ExecutionResponse toExecution(TestExecution execution) {
        return new ExecutionResponse(
                execution.id(),
                execution.sourceId(),
                ApiModels.RevisionResponse.from(execution.revision()),
                execution.environment(),
                execution.status(),
                execution.requestedBy(),
                execution.requestedAt(),
                execution.startedAt(),
                execution.completedAt(),
                execution.durationMs(),
                execution.errorMessage(),
                execution.results().stream()
                        .map(result -> new ScenarioExecutionResultResponse(
                                result.resultId(),
                                result.scenarioId(),
                                result.scenarioName(),
                                result.exampleValues(),
                                result.status(),
                                result.durationMs(),
                                result.errorMessage()
                        ))
                        .toList()
        );
    }

    public ExecutionSummaryResponse toExecutionSummary(TestExecution execution) {
        return new ExecutionSummaryResponse(
                execution.id(),
                execution.environment(),
                execution.status(),
                ApiModels.RevisionResponse.from(execution.revision()),
                execution.requestedAt(),
                execution.startedAt(),
                execution.completedAt(),
                execution.durationMs()
        );
    }
}
