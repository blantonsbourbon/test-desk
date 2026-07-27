package com.acme.testdesk.api;

import com.acme.testdesk.service.SourceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/sources")
public class SourceController {
    private final SourceService sourceService;
    private final ApiMapper mapper;

    public SourceController(SourceService sourceService, ApiMapper mapper) {
        this.sourceService = sourceService;
        this.mapper = mapper;
    }

    @GetMapping
    public ApiModels.SourceListResponse list() {
        return new ApiModels.SourceListResponse(sourceService.list().stream().map(mapper::toSource).toList());
    }

    @GetMapping("/{sourceId}")
    public ApiModels.SourceResponse get(@PathVariable("sourceId") String sourceId) {
        return mapper.toSource(sourceService.get(sourceId));
    }

    @PostMapping("/{sourceId}/sync")
    public ResponseEntity<ApiModels.SourceResponse> sync(@PathVariable("sourceId") String sourceId) {
        sourceService.sync(sourceId);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(mapper.toSource(sourceService.get(sourceId)));
    }
}
