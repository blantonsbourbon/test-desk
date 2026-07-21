package com.acme.testcontrolplane.service;

import com.acme.testcontrolplane.domain.TestSource;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SourceService {
    private final CatalogService catalogService;

    public SourceService(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    public List<TestSource> list() {
        return catalogService.listSources();
    }

    public TestSource get(String sourceId) {
        return catalogService.getSource(sourceId);
    }

    public void sync(String sourceId) {
        catalogService.requestSync(sourceId);
    }

}
