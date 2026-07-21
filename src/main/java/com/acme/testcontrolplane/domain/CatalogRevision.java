package com.acme.testcontrolplane.domain;

import java.time.Instant;

public record CatalogRevision(String commit, String branch, Instant syncedAt) {
}
