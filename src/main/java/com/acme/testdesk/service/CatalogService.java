package com.acme.testdesk.service;

import com.acme.testdesk.api.ApiModels;
import com.acme.testdesk.domain.CatalogEntry;
import com.acme.testdesk.domain.CatalogRevision;
import com.acme.testdesk.domain.ExecutionEntryResult;
import com.acme.testdesk.domain.TestGroup;
import com.acme.testdesk.domain.TestResultStatus;
import com.acme.testdesk.domain.TestSource;
import com.acme.testdesk.domain.TestExecution;
import com.acme.testdesk.domain.SourceSyncStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
public class CatalogService {
    private final ConcurrentMap<String, TestSource> sources = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, TestGroup> groups = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, CatalogEntry> entries = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, LatestEntryResult> latestResults = new ConcurrentHashMap<>();
    private final List<CatalogDefinitionAdapter> definitionAdapters;
    private final ScheduledExecutorService scheduler;
    private final Object catalogLock = new Object();

    public CatalogService(
            ScheduledExecutorService scheduler,
            List<CatalogDefinitionAdapter> definitionAdapters
    ) {
        this.scheduler = scheduler;
        this.definitionAdapters = List.copyOf(definitionAdapters);
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

        synchronized (catalogLock) {
            List<TestGroup> matchingGroups = groupsForSourceUnsafe(sourceId).stream()
                    .map(group -> filterGroup(group, normalizedQuery, normalizedStatus, normalizedTags))
                    .filter(group -> !group.entries().isEmpty())
                    .toList();
            return new CatalogSnapshot(
                    source,
                    source.latestRevision(),
                    matchingGroups,
                    sourceStatsUnsafe(sourceId));
        }
    }

    public List<TestGroup> getGroupsForSource(String sourceId) {
        getSource(sourceId);
        synchronized (catalogLock) {
            return groupsForSourceUnsafe(sourceId);
        }
    }

    public CatalogEntry getEntry(String entryId) {
        CatalogEntry entry = entries.get(entryId);
        if (entry == null) {
            throw new ResourceNotFoundException("Catalog Entry not found: " + entryId);
        }
        return entry;
    }

    public List<CatalogEntry> getEntries(Collection<String> entryIds) {
        if (entryIds == null || entryIds.isEmpty()) {
            throw new InvalidExecutionException("At least one Catalog Entry is required");
        }
        if (entryIds.stream().anyMatch(id -> id == null || id.isBlank())) {
            throw new InvalidExecutionException("entryIds cannot contain blank values");
        }
        return entryIds.stream().distinct().map(this::getEntry).toList();
    }

    public TestGroup getGroup(String groupId) {
        TestGroup group = groups.get(groupId);
        if (group == null) {
            throw new ResourceNotFoundException("Test Group not found: " + groupId);
        }
        return group;
    }

    public EntryStatus latestEntryStatus(String entryId) {
        CatalogEntry entry = getEntry(entryId);
        LatestEntryResult latest = latestResults.get(entryKey(entry.sourceId(), entry.id()));
        return latest == null
                ? new EntryStatus(null, null, null)
                : new EntryStatus(latest.status(), latest.durationMs(), latest.completedAt());
    }

    public List<String> tagsForSource(String sourceId) {
        return getGroupsForSource(sourceId).stream()
                .flatMap(group -> group.entries().stream())
                .flatMap(entry -> entry.tags().stream())
                .distinct()
                .sorted()
                .toList();
    }

    public void recordExecution(TestExecution execution) {
        Instant completedAt = execution.completedAt() == null ? Instant.now() : execution.completedAt();
        execution.results().stream()
                .collect(Collectors.groupingBy(ExecutionEntryResult::entryId))
                .forEach((entryId, results) -> latestResults.put(
                        entryKey(execution.sourceId(), entryId),
                        new LatestEntryResult(
                                aggregateResultStatus(results),
                                results.stream().mapToLong(ExecutionEntryResult::durationMs).sum(),
                                completedAt)));
    }

    public void requestSync(String sourceId) {
        TestSource source = getSource(sourceId);
        if (!source.tryMarkSyncing()) {
            return;
        }
        CatalogRevision currentRevision = source.latestRevision();
        if (currentRevision == null) {
            source.markSyncError("No Catalog Revision is available to synchronize");
            return;
        }
        String nextCommit = nextCommit(currentRevision.commit());
        try {
            scheduler.schedule(() -> completeSync(source, currentRevision, nextCommit), 350, TimeUnit.MILLISECONDS);
        } catch (RejectedExecutionException exception) {
            source.markSyncError("Sync scheduler is unavailable");
        }
    }

    private void completeSync(TestSource source, CatalogRevision currentRevision, String nextCommit) {
        try {
            CatalogRevision nextRevision = new CatalogRevision(nextCommit, currentRevision.branch(), Instant.now());
            List<TestGroup> nextGroups = adapterFor(source).load(source, nextRevision);
            synchronized (catalogLock) {
                removeSourceCatalogUnsafe(source.id());
                installGroupsUnsafe(nextGroups);
                source.markSynced(nextRevision);
            }
        } catch (RuntimeException exception) {
            source.markSyncError("Catalog sync failed");
        }
    }

    private TestGroup filterGroup(TestGroup group, String query, String status, List<String> tags) {
        List<CatalogEntry> matchingEntries = group.entries().stream()
                .filter(entry -> matchesQuery(group, entry, query))
                .filter(entry -> matchesStatus(entry, status))
                .filter(entry -> matchesTags(group, entry, tags))
                .toList();
        return new TestGroup(
                group.id(),
                group.sourceId(),
                group.name(),
                group.kind(),
                group.tags(),
                group.sourcePath(),
                matchingEntries);
    }

    private boolean matchesQuery(TestGroup group, CatalogEntry entry, String query) {
        if (query.isBlank()) {
            return true;
        }
        return String.join(
                        " ",
                        group.name(),
                        entry.name(),
                        entry.sourcePath(),
                        entry.framework(),
                        String.join(" ", group.tags()),
                        String.join(" ", entry.tags()))
                .toLowerCase(Locale.ROOT)
                .contains(query);
    }

    private boolean matchesTags(TestGroup group, CatalogEntry entry, List<String> tags) {
        if (tags.isEmpty()) {
            return true;
        }
        List<String> availableTags = java.util.stream.Stream.concat(
                        group.tags().stream(),
                        entry.tags().stream())
                .map(value -> value.toLowerCase(Locale.ROOT))
                .toList();
        return tags.stream().allMatch(availableTags::contains);
    }

    private boolean matchesStatus(CatalogEntry entry, String status) {
        if (status.isBlank() || status.equals("ALL")) {
            return true;
        }
        TestResultStatus latest = latestStatus(entry);
        return status.equals("NEVER_RUN") ? latest == null : latest != null && latest.name().equals(status);
    }

    private TestResultStatus latestStatus(CatalogEntry entry) {
        LatestEntryResult latest = latestResults.get(entryKey(entry.sourceId(), entry.id()));
        return latest == null ? null : latest.status();
    }

    private ApiModels.CatalogStats sourceStatsUnsafe(String sourceId) {
        List<CatalogEntry> sourceEntries = groupsForSourceUnsafe(sourceId).stream()
                .flatMap(group -> group.entries().stream())
                .toList();
        Instant cutoff = Instant.now().minus(Duration.ofHours(24));
        long passedCount = sourceEntries.stream()
                .map(entry -> latestResults.get(entryKey(sourceId, entry.id())))
                .filter(latest -> latest != null && latest.completedAt().isAfter(cutoff))
                .map(LatestEntryResult::status)
                .filter(TestResultStatus.PASSED::equals)
                .count();
        long failedCount = sourceEntries.stream()
                .map(entry -> latestResults.get(entryKey(sourceId, entry.id())))
                .filter(latest -> latest != null && latest.completedAt().isAfter(cutoff))
                .map(LatestEntryResult::status)
                .filter(TestResultStatus.FAILED::equals)
                .count();
        long completedCount = passedCount + failedCount;
        Double passRate = completedCount == 0 ? null : passedCount * 100.0 / completedCount;
        return new ApiModels.CatalogStats(
                (int) groupsForSourceUnsafe(sourceId).size(),
                sourceEntries.size(),
                passedCount,
                failedCount,
                passRate);
    }

    private TestResultStatus aggregateResultStatus(List<ExecutionEntryResult> results) {
        if (results.stream().anyMatch(result -> result.status() == TestResultStatus.ERROR)) {
            return TestResultStatus.ERROR;
        }
        if (results.stream().anyMatch(result -> result.status() == TestResultStatus.FAILED)) {
            return TestResultStatus.FAILED;
        }
        if (results.stream().anyMatch(result -> result.status() == TestResultStatus.CANCELLED)) {
            return TestResultStatus.CANCELLED;
        }
        if (results.stream().anyMatch(result -> result.status() == TestResultStatus.SKIPPED)) {
            return TestResultStatus.SKIPPED;
        }
        return TestResultStatus.PASSED;
    }

    private List<TestGroup> groupsForSourceUnsafe(String sourceId) {
        return groups.values().stream()
                .filter(group -> group.sourceId().equals(sourceId))
                .sorted(Comparator.comparing(TestGroup::name))
                .toList();
    }

    private void seedCatalog() {
        CatalogRevision revision = new CatalogRevision("a13f9c2", "main", Instant.parse("2026-07-21T02:10:00Z"));
        TestSource source = new TestSource(
                "checkout-web",
                "Checkout web",
                "acme/checkout-web-e2e",
                "main",
                "bdd-simulation",
                revision,
                SourceSyncStatus.SYNCED);
        sources.put(source.id(), source);
        installGroupsUnsafe(adapterFor(source).load(source, revision));
    }

    private void installGroupsUnsafe(List<TestGroup> nextGroups) {
        nextGroups.forEach(group -> {
            groups.put(group.id(), group);
            group.entries().forEach(entry -> entries.put(entry.id(), entry));
        });
    }

    private void removeSourceCatalogUnsafe(String sourceId) {
        groups.values().removeIf(group -> group.sourceId().equals(sourceId));
        entries.values().removeIf(entry -> entry.sourceId().equals(sourceId));
    }

    private CatalogDefinitionAdapter adapterFor(TestSource source) {
        return definitionAdapters.stream()
                .filter(adapter -> adapter.id().equals(source.catalogAdapterId()))
                .findFirst()
                .orElseThrow(() -> new InvalidExecutionException(
                        "Catalog Definition Adapter not found: " + source.catalogAdapterId()));
    }

    private String entryKey(String sourceId, String entryId) {
        return sourceId + ":" + entryId;
    }

    private String nextCommit(String currentCommit) {
        return switch (currentCommit) {
            case "a13f9c2" -> "b27e4ad";
            default -> "a13f9c2";
        };
    }

    public record CatalogSnapshot(
            TestSource source,
            CatalogRevision revision,
            List<TestGroup> groups,
            ApiModels.CatalogStats stats
    ) {
        public CatalogSnapshot {
            groups = List.copyOf(groups);
        }
    }

    public record EntryStatus(TestResultStatus status, Long durationMs, Instant lastRunAt) {
    }

    private record LatestEntryResult(TestResultStatus status, long durationMs, Instant completedAt) {
    }
}
