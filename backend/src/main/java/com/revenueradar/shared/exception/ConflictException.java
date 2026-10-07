package com.revenueradar.shared.exception;

/**
 * Resource conflict
 */
public class ConflictException extends AppException {

    public ConflictException() {
        super(ErrorCode.CONFLICT, "Resource conflict");
    }

    public ConflictException(String message) {
        super(ErrorCode.CONFLICT, message);
    }

    public ConflictException(String message, Throwable cause) {
        super(ErrorCode.CONFLICT, message, cause);
    }
}
