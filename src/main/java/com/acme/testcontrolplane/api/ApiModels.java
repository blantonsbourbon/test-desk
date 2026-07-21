package com.acme.testcontrolplane.api;

import com.acme.testcontrolplane.domain.CatalogRevision;
import com.acme.testcontrolplane.domain.Environment;
import com.acme.testcontrolplane.domain.ExecutionStatus;
import com.acme.testcontrolplane.domain.ScenarioExecutionStatus;
import com.acme.testcontrolplane.domain.ScenarioKind;
import com.acme.testcontrolplane.domain.SourceSyncStatus;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;

public final class ApiModels {
    private ApiModels() {
    }

    public record RevisionResponse(String commit, String branch, Instant syncedAt) {
        public static RevisionResponse from(CatalogRevision revision) {
            return new RevisionResponse(revision.commit(), revision.branch(), revision.syncedAt());
        }
    }

    public record SourceResponse(
            String id,
            String name,
            String repository,
            String defaultBranch,
            RevisionResponse latestRevision,
            SourceSyncStatus syncStatus,
            String syncError,
            int featureCount,
            int scenarioCount
    ) {
    }

    public record SourceListResponse(List<SourceResponse> items) {
    }

    public record ScenarioSummaryResponse(
            String id,
            String name,
            ScenarioKind kind,
            List<String> tags,
            String sourcePath,
            int line,
            ScenarioExecutionStatus latestStatus,
            Long lastDurationMs,
            Instant lastRunAt
    ) {
    }

    public record FeatureResponse(
            String id,
            String name,
            List<String> tags,
            String sourcePath,
            int scenarioCount,
            List<ScenarioSummaryResponse> scenarios
    ) {
    }

    public record CatalogStats(int featureCount, int scenarioCount, long passedCount, long failedCount) {
    }

    public record CatalogResponse(
            SourceResponse source,
            RevisionResponse revision,
            List<FeatureResponse> features,
            CatalogStats stats
    ) {
    }

    public record ScenarioStepResponse(String keyword, String text) {
    }

    public record ScenarioDetailsResponse(
            String id,
            String featureId,
            String featureName,
            String name,
            ScenarioKind kind,
            List<String> tags,
            String sourcePath,
            int line,
            List<ScenarioStepResponse> steps,
            ScenarioExecutionStatus latestStatus,
            Long lastDurationMs,
            Instant lastRunAt,
            List<ExecutionSummaryResponse> recentExecutions
    ) {
    }

    public record ExecutionSummaryResponse(
            String id,
            Environment environment,
            ExecutionStatus status,
            RevisionResponse revision,
            Instant requestedAt,
            Instant completedAt,
            long durationMs
    ) {
    }

    public record ScenarioExecutionResultResponse(
            String scenarioId,
            String scenarioName,
            ScenarioExecutionStatus status,
            long durationMs,
            String errorMessage
    ) {
    }

    public record ExecutionResponse(
            String id,
            String sourceId,
            RevisionResponse revision,
            Environment environment,
            ExecutionStatus status,
            String requestedBy,
            Instant requestedAt,
            Instant startedAt,
            Instant completedAt,
            long durationMs,
            String errorMessage,
            List<ScenarioExecutionResultResponse> results
    ) {
    }

    public record ExecutionListResponse(List<ExecutionResponse> items) {
    }

    public record CreateExecutionRequest(
            String sourceId,
            @NotEmpty(message = "scenarioIds must contain at least one scenario") List<String> scenarioIds,
            @NotNull(message = "environment is required") Environment environment
    ) {
    }

    public record ErrorResponse(String code, String message, Instant timestamp) {
    }
}
