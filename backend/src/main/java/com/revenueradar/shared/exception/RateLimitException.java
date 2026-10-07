package com.revenueradar.shared.exception;

/**
 * Too many requests
 */
public class RateLimitException extends AppException {

    public RateLimitException() {
        super(ErrorCode.RATE_LIMITED, "Too many requests");
    }

    public RateLimitException(String message) {
        super(ErrorCode.RATE_LIMITED, message);
    }

    public RateLimitException(String message, Throwable cause) {
        super(ErrorCode.RATE_LIMITED, message, cause);
    }
}
