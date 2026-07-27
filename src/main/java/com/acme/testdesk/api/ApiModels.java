package com.acme.testdesk.api;

import com.acme.testdesk.domain.CatalogRevision;
import com.acme.testdesk.domain.DefinitionKind;
import com.acme.testdesk.domain.Environment;
import com.acme.testdesk.domain.ExecutionOrigin;
import com.acme.testdesk.domain.ExecutionStatus;
import com.acme.testdesk.domain.ExternalExecution;
import com.acme.testdesk.domain.TestGroupKind;
import com.acme.testdesk.domain.TestResultStatus;
import com.acme.testdesk.domain.TestType;
import com.acme.testdesk.domain.SourceSyncStatus;
import com.fasterxml.jackson.annotation.JsonAlias;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.Map;

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
            int groupCount,
            int entryCount
    ) {
    }

    public record SourceListResponse(List<SourceResponse> items) {
    }

    public record CatalogEntrySummaryResponse(
            String id,
            String name,
            TestType testType,
            String framework,
            DefinitionKind definitionKind,
            List<String> tags,
            String sourcePath,
            int line,
            int caseCount,
            String status,
            Long durationMs,
            Instant lastRunAt
    ) {
    }

    public record TestGroupResponse(
            String id,
            String name,
            TestGroupKind kind,
            List<String> tags,
            String sourcePath,
            int entryCount,
            List<CatalogEntrySummaryResponse> entries
    ) {
    }

    public record CatalogStats(
            int groupCount,
            int entryCount,
            long passedCount,
            long failedCount,
            Double passRate
    ) {
    }

    public record CatalogResponse(
            SourceResponse source,
            RevisionResponse revision,
            List<TestGroupResponse> groups,
            CatalogStats stats
    ) {
    }

    public record TestStepResponse(String keyword, String text) {
    }

    public record CatalogEntryDetailsResponse(
            String id,
            String sourceId,
            String groupId,
            String groupName,
            String name,
            TestType testType,
            String framework,
            DefinitionKind definitionKind,
            List<String> tags,
            String sourcePath,
            int line,
            List<TestStepResponse> steps,
            List<Map<String, String>> examples,
            String status,
            Long durationMs,
            Instant lastRunAt,
            List<ExecutionSummaryResponse> recentExecutions
    ) {
    }

    public record ExecutionSummaryResponse(
            String id,
            Environment environment,
            ExecutionStatus status,
            RevisionResponse revision,
            String profileId,
            Instant requestedAt,
            Instant startedAt,
            Instant completedAt,
            long durationMs
    ) {
    }

    public record ExternalExecutionResponse(String reference, String url) {
        public static ExternalExecutionResponse from(ExternalExecution execution) {
            return execution == null ? null : new ExternalExecutionResponse(execution.reference(), execution.url());
        }
    }

    public record ExecutionEntryResultResponse(
            String resultId,
            String entryId,
            String entryName,
            String caseId,
            Map<String, String> caseValues,
            TestResultStatus status,
            long durationMs,
            String errorMessage
    ) {
    }

    public record ExecutionResponse(
            String id,
            String sourceId,
            RevisionResponse revision,
            String profileId,
            ExecutionOrigin origin,
            ExternalExecutionResponse externalExecution,
            Environment environment,
            ExecutionStatus status,
            String requestedBy,
            Instant requestedAt,
            Instant startedAt,
            Instant completedAt,
            long durationMs,
            String errorMessage,
            List<ExecutionEntryResultResponse> results
    ) {
    }

    public record ExecutionListResponse(List<ExecutionResponse> items) {
    }

    public record CreateExecutionRequest(
            String sourceId,
            @JsonAlias("scenarioIds")
            @NotEmpty(message = "entryIds must contain at least one entry")
            List<String> entryIds,
            @NotNull(message = "environment is required") Environment environment,
            String revisionCommit,
            ExecutionOrigin origin
    ) {
    }

    public record ErrorResponse(String code, String message, Instant timestamp) {
    }
}
