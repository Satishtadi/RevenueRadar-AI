package com.revenueradar.shared.exception;

/**
 * Validation failed
 */
public class ValidationException extends AppException {

    public ValidationException() {
        super(ErrorCode.VALIDATION_ERROR, "Validation failed");
    }

    public ValidationException(String message) {
        super(ErrorCode.VALIDATION_ERROR, message);
    }

    public ValidationException(String message, Throwable cause) {
        super(ErrorCode.VALIDATION_ERROR, message, cause);
    }
}
