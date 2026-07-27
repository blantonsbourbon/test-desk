package com.acme.testdesk.api;

import com.acme.testdesk.domain.BddCatalogEntryDetails;
import com.acme.testdesk.domain.CatalogEntry;
import com.acme.testdesk.domain.ExecutionEntryResult;
import com.acme.testdesk.domain.TestExecution;
import com.acme.testdesk.domain.TestGroup;
import com.acme.testdesk.domain.TestSource;
import com.acme.testdesk.service.CatalogService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ApiMapper {
    private final CatalogService catalogService;

    public ApiMapper(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    public ApiModels.SourceResponse toSource(TestSource source) {
        List<TestGroup> sourceGroups = catalogService.getGroupsForSource(source.id());
        return new ApiModels.SourceResponse(
                source.id(),
                source.name(),
                source.repository(),
                source.defaultBranch(),
                source.latestRevision() == null ? null : ApiModels.RevisionResponse.from(source.latestRevision()),
                source.syncStatus(),
                source.syncError(),
                sourceGroups.size(),
                sourceGroups.stream().mapToInt(group -> group.entries().size()).sum()
        );
    }

    public ApiModels.CatalogResponse toCatalog(CatalogService.CatalogSnapshot snapshot) {
        return new ApiModels.CatalogResponse(
                toSource(snapshot.source()),
                snapshot.revision() == null ? null : ApiModels.RevisionResponse.from(snapshot.revision()),
                snapshot.groups().stream().map(this::toGroup).toList(),
                snapshot.stats()
        );
    }

    public ApiModels.TestGroupResponse toGroup(TestGroup group) {
        return new ApiModels.TestGroupResponse(
                group.id(),
                group.name(),
                group.kind(),
                group.tags(),
                group.sourcePath(),
                group.entries().size(),
                group.entries().stream().map(this::toEntrySummary).toList()
        );
    }

    public ApiModels.CatalogEntrySummaryResponse toEntrySummary(CatalogEntry entry) {
        CatalogService.EntryStatus status = catalogService.latestEntryStatus(entry.id());
        return new ApiModels.CatalogEntrySummaryResponse(
                entry.id(),
                entry.name(),
                entry.testType(),
                entry.framework(),
                entry.definitionKind(),
                entry.tags(),
                entry.sourcePath(),
                entry.line(),
                entry.caseValues().size() == 1 && entry.caseValues().get(0).isEmpty()
                        ? 0
                        : entry.caseValues().size(),
                catalogStatus(status.status()),
                status.durationMs(),
                status.lastRunAt()
        );
    }

    public ApiModels.CatalogEntryDetailsResponse toEntryDetails(
            CatalogEntry entry,
            List<TestExecution> recentExecutions
    ) {
        CatalogService.EntryStatus status = catalogService.latestEntryStatus(entry.id());
        List<ApiModels.TestStepResponse> steps = List.of();
        List<java.util.Map<String, String>> examples = List.of();
        if (entry.details() instanceof BddCatalogEntryDetails bdd) {
            steps = bdd.steps().stream()
                    .map(step -> new ApiModels.TestStepResponse(step.keyword(), step.text()))
                    .toList();
            examples = bdd.examples();
        }
        String groupName = catalogService.getGroup(entry.groupId()).name();
        return new ApiModels.CatalogEntryDetailsResponse(
                entry.id(),
                entry.sourceId(),
                entry.groupId(),
                groupName,
                entry.name(),
                entry.testType(),
                entry.framework(),
                entry.definitionKind(),
                entry.tags(),
                entry.sourcePath(),
                entry.line(),
                steps,
                examples,
                catalogStatus(status.status()),
                status.durationMs(),
                status.lastRunAt(),
                recentExecutions.stream().map(this::toExecutionSummary).toList()
        );
    }

    public ApiModels.ExecutionResponse toExecution(TestExecution execution) {
        return new ApiModels.ExecutionResponse(
                execution.id(),
                execution.sourceId(),
                ApiModels.RevisionResponse.from(execution.revision()),
                execution.profileId(),
                execution.origin(),
                ApiModels.ExternalExecutionResponse.from(execution.externalExecution()),
                execution.environment(),
                execution.status(),
                execution.requestedBy(),
                execution.requestedAt(),
                execution.startedAt(),
                execution.completedAt(),
                execution.durationMs(),
                execution.errorMessage(),
                execution.results().stream().map(this::toResult).toList()
        );
    }

    public ApiModels.ExecutionSummaryResponse toExecutionSummary(TestExecution execution) {
        return new ApiModels.ExecutionSummaryResponse(
                execution.id(),
                execution.environment(),
                execution.status(),
                ApiModels.RevisionResponse.from(execution.revision()),
                execution.profileId(),
                execution.requestedAt(),
                execution.startedAt(),
                execution.completedAt(),
                execution.durationMs()
        );
    }

    private ApiModels.ExecutionEntryResultResponse toResult(ExecutionEntryResult result) {
        return new ApiModels.ExecutionEntryResultResponse(
                result.resultId(),
                result.entryId(),
                result.entryName(),
                result.caseId(),
                result.caseValues(),
                result.status(),
                result.durationMs(),
                result.errorMessage()
        );
    }

    private String catalogStatus(com.acme.testdesk.domain.TestResultStatus status) {
        return status == null ? "NEVER_RUN" : status.name();
    }
}
