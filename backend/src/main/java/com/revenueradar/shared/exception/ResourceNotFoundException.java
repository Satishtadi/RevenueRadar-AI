package com.revenueradar.shared.exception;

/**
 * Resource not found
 */
public class ResourceNotFoundException extends AppException {

    public ResourceNotFoundException() {
        super(ErrorCode.RESOURCE_NOT_FOUND, "Resource not found");
    }

    public ResourceNotFoundException(String message) {
        super(ErrorCode.RESOURCE_NOT_FOUND, message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(ErrorCode.RESOURCE_NOT_FOUND, message, cause);
    }
}
