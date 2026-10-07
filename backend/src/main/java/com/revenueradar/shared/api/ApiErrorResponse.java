package com.revenueradar.shared.api;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * Standard error envelope. Stack traces are never exposed to clients.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        boolean success,
        String errorCode,
        String message,
        List<FieldViolation> errors,
        Instant timestamp
) {
    public record FieldViolation(String field, String message) {
    }

    public static ApiErrorResponse of(String errorCode, String message) {
        return new ApiErrorResponse(false, errorCode, message, null, Instant.now());
    }

    public static ApiErrorResponse of(String errorCode, String message, List<FieldViolation> errors) {
        return new ApiErrorResponse(false, errorCode, message, errors, Instant.now());
    }
}
