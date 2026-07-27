package com.acme.testdesk.service;

import com.acme.testdesk.domain.ExternalExecution;

/** Dispatches and observes a profile without exposing connector details to callers. */
public interface ExecutionConnector {
    String id();

    ExternalExecution submit(DispatchCommand command);

    ConnectorSnapshot inspect(DispatchCommand command, ExternalExecution externalExecution);

    void cancel(DispatchCommand command, ExternalExecution externalExecution);
}
