package com.acme.testdesk.service;

public class InvalidExecutionException extends RuntimeException {
    public InvalidExecutionException(String message) {
        super(message);
    }
}
