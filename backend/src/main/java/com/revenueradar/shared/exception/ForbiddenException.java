package com.revenueradar.shared.exception;

/**
 * You do not have permission to perform this action
 */
public class ForbiddenException extends AppException {

    public ForbiddenException() {
        super(ErrorCode.FORBIDDEN, "You do not have permission to perform this action");
    }

    public ForbiddenException(String message) {
        super(ErrorCode.FORBIDDEN, message);
    }

    public ForbiddenException(String message, Throwable cause) {
        super(ErrorCode.FORBIDDEN, message, cause);
    }
}
