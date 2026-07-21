package com.acme.testcontrolplane.api;

import com.acme.testcontrolplane.service.CatalogService;
import com.acme.testcontrolplane.service.ExecutionService;
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
            @RequestParam String sourceId,
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(required = false) List<String> tag
    ) {
        return mapper.toCatalog(catalogService.getCatalog(sourceId, q, status, tag));
    }

    @GetMapping("/scenarios/{scenarioId}")
    public ApiModels.ScenarioDetailsResponse getScenario(
            @PathVariable String scenarioId,
            @RequestParam(defaultValue = "5") int limit
    ) {
        return mapper.toScenarioDetails(
                catalogService.getScenario(scenarioId),
                executionService.recentForScenario(scenarioId, Math.min(limit, 5))
        );
    }
}
