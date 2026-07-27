package com.acme.testdesk.api;

import com.acme.testdesk.service.CatalogService;
import com.acme.testdesk.service.ExecutionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/catalog")
public class CatalogController {
    private final CatalogService catalogService;
    private final ExecutionService executionService;
    private final ApiMapper mapper;

    public CatalogController(CatalogService catalogService, ExecutionService executionService, ApiMapper mapper) {
        this.catalogService = catalogService;
        this.executionService = executionService;
        this.mapper = mapper;
    }

    @GetMapping
    public ApiModels.CatalogResponse getCatalog(
            @RequestParam("sourceId") String sourceId,
            @RequestParam(name = "q", defaultValue = "") String q,
            @RequestParam(name = "status", defaultValue = "") String status,
            @RequestParam(name = "tag", required = false) List<String> tag
    ) {
        return mapper.toCatalog(catalogService.getCatalog(sourceId, q, status, tag));
    }

    @GetMapping({"/entries/{entryId}", "/scenarios/{entryId}"})
    public ApiModels.CatalogEntryDetailsResponse getEntry(
            @PathVariable("entryId") String entryId,
            @RequestParam(name = "limit", defaultValue = "5") int limit
    ) {
        return mapper.toEntryDetails(
                catalogService.getEntry(entryId),
                executionService.recentForEntry(entryId, Math.min(limit, 5))
        );
    }
}
