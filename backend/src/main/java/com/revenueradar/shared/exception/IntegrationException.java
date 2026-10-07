package com.revenueradar.shared.exception;

/**
 * External integration failed
 */
public class IntegrationException extends AppException {

    public IntegrationException() {
        super(ErrorCode.INTEGRATION_ERROR, "External integration failed");
    }

    public IntegrationException(String message) {
        super(ErrorCode.INTEGRATION_ERROR, message);
    }

    public IntegrationException(String message, Throwable cause) {
        super(ErrorCode.INTEGRATION_ERROR, message, cause);
    }
}
