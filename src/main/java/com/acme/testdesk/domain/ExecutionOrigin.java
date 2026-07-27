package com.acme.testdesk.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum ExecutionOrigin {
    UI,
    REST_API,
    SCHEDULE,
    WEBHOOK;

    @JsonCreator
    public static ExecutionOrigin fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Execution origin is invalid");
        }
    }

    @JsonValue
    public String jsonValue() {
        return name().toLowerCase(Locale.ROOT);
    }
}
