package com.acme.testcontrolplane.service;

public class InvalidExecutionException extends RuntimeException {
    public InvalidExecutionException(String message) {
        super(message);
    }
}
