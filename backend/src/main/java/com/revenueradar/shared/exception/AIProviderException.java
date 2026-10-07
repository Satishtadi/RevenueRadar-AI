package com.revenueradar.shared.exception;

/**
 * AI provider request failed
 */
public class AIProviderException extends AppException {

    public AIProviderException() {
        super(ErrorCode.AI_PROVIDER_ERROR, "AI provider request failed");
    }

    public AIProviderException(String message) {
        super(ErrorCode.AI_PROVIDER_ERROR, message);
    }

    public AIProviderException(String message, Throwable cause) {
        super(ErrorCode.AI_PROVIDER_ERROR, message, cause);
    }
}
