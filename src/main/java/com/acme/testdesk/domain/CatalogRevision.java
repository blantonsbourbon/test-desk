package com.acme.testdesk.domain;

import java.time.Instant;

public record CatalogRevision(String commit, String branch, Instant syncedAt) {
}
