package com.acme.testcontrolplane.domain;

import java.time.Instant;

public final class TestSource {
    private final String id;
    private final String name;
    private final String repository;
    private final String defaultBranch;
    private volatile CatalogRevision latestRevision;
    private volatile SourceSyncStatus syncStatus;
    private volatile String syncError;

    public TestSource(
            String id,
            String name,
            String repository,
            String defaultBranch,
            CatalogRevision latestRevision,
            SourceSyncStatus syncStatus
    ) {
        this.id = id;
        this.name = name;
        this.repository = repository;
        this.defaultBranch = defaultBranch;
        this.latestRevision = latestRevision;
        this.syncStatus = syncStatus;
    }

    public String id() {
        return id;
    }

    public String name() {
        return name;
    }

    public String repository() {
        return repository;
    }

    public String defaultBranch() {
        return defaultBranch;
    }

    public CatalogRevision latestRevision() {
        return latestRevision;
    }

    public SourceSyncStatus syncStatus() {
        return syncStatus;
    }

    public String syncError() {
        return syncError;
    }

    public synchronized void markSyncing() {
        syncStatus = SourceSyncStatus.SYNCING;
        syncError = null;
    }

    public synchronized void markSynced(String commit) {
        latestRevision = new CatalogRevision(commit, defaultBranch, Instant.now());
        syncStatus = SourceSyncStatus.SYNCED;
        syncError = null;
    }

    public synchronized void markSyncError(String message) {
        syncStatus = SourceSyncStatus.ERROR;
        syncError = message;
    }
}
