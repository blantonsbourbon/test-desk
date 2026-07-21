package com.acme.testcontrolplane.api;

import com.acme.testcontrolplane.domain.Environment;
import com.acme.testcontrolplane.domain.ExecutionStatus;
import com.acme.testcontrolplane.service.ExecutionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/executions")
public class ExecutionController {
    private final ExecutionService executionService;
    private final ApiMapper mapper;

    public ExecutionController(ExecutionService executionService, ApiMapper mapper) {
        this.executionService = executionService;
        this.mapper = mapper;
    }

    @PostMapping
    public ResponseEntity<ApiModels.ExecutionResponse> create(
            @Valid @RequestBody ApiModels.CreateExecutionRequest request
    ) {
        var execution = executionService.create(request.sourceId(), request.scenarioIds(), request.environment());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toExecution(execution));
    }

    @GetMapping
    public ApiModels.ExecutionListResponse list(
            @RequestParam(required = false) String sourceId,
            @RequestParam(required = false) ExecutionStatus status,
            @RequestParam(required = false) Environment environment,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to
    ) {
        return new ApiModels.ExecutionListResponse(
                executionService.list(sourceId, status, environment, from, to).stream()
                        .map(mapper::toExecution)
                        .toList());
    }

    @GetMapping("/{executionId}")
    public ApiModels.ExecutionResponse get(@PathVariable String executionId) {
        return mapper.toExecution(executionService.get(executionId));
    }

    @PostMapping("/{executionId}/cancel")
    public ApiModels.ExecutionResponse cancel(@PathVariable String executionId) {
        return mapper.toExecution(executionService.cancel(executionId));
    }
}
