package com.acme.testdesk.service;

import com.acme.testdesk.domain.CatalogRevision;
import com.acme.testdesk.domain.TestGroup;
import com.acme.testdesk.domain.TestSource;

import java.util.List;

/** Reads one framework's definitions from an immutable source revision. */
public interface CatalogDefinitionAdapter {
    String id();

    List<TestGroup> load(TestSource source, CatalogRevision revision);
}
