package com.revenueradar.shared.exception;

import org.springframework.http.HttpStatus;

/**
 * Canonical error codes returned in the error envelope.
 * Codes are stable API contract — never rename without a version bump.
 */
public enum ErrorCode {

    // generic
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Validation failed"),
    MALFORMED_REQUEST(HttpStatus.BAD_REQUEST, "Malformed request"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Authentication required"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "Token expired"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Invalid email or password"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "You do not have permission to perform this action"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Resource not found"),
    CONFLICT(HttpStatus.CONFLICT, "Resource conflict"),
    UNPROCESSABLE(HttpStatus.UNPROCESSABLE_ENTITY, "Request could not be processed"),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "Too many requests"),
    AI_LIMIT_REACHED(HttpStatus.TOO_MANY_REQUESTS, "AI usage limit reached for current plan"),
    PLAN_LIMIT_REACHED(HttpStatus.TOO_MANY_REQUESTS, "Plan limit reached"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred"),
    SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "Service temporarily unavailable"),

    // external integrations
    AI_PROVIDER_ERROR(HttpStatus.BAD_GATEWAY, "AI provider request failed"),
    AI_OUTPUT_INVALID(HttpStatus.BAD_GATEWAY, "AI returned an unusable response"),
    INTEGRATION_ERROR(HttpStatus.BAD_GATEWAY, "External integration failed"),

    // domain — identity / organization
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS"),
    ORGANIZATION_NOT_FOUND(HttpStatus.NOT_FOUND, "Organization not found"),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "User not found"),
    ONBOARDING_ALREADY_COMPLETED(HttpStatus.CONFLICT, "Onboarding already completed"),

    // domain — crm
    CUSTOMER_NOT_FOUND(HttpStatus.NOT_FOUND, "Customer not found"),
    LEAD_NOT_FOUND(HttpStatus.NOT_FOUND, "Lead not found"),
    LEAD_STATUS_INVALID(HttpStatus.UNPROCESSABLE_ENTITY, "Invalid lead status transition"),
    LOST_REASON_REQUIRED(HttpStatus.UNPROCESSABLE_ENTITY, "Lost reason is required when marking a lead as LOST"),
    FOLLOWUP_NOT_FOUND(HttpStatus.NOT_FOUND, "Follow-up not found"),
    APPOINTMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "Appointment not found"),
    CONVERSATION_NOT_FOUND(HttpStatus.NOT_FOUND, "Conversation not found"),
    RECOVERY_ACTION_NOT_FOUND(HttpStatus.NOT_FOUND, "Recovery action not found"),
    AI_MESSAGE_NOT_FOUND(HttpStatus.NOT_FOUND, "AI message not found"),
    AI_MESSAGE_STATE_INVALID(HttpStatus.UNPROCESSABLE_ENTITY, "AI message is not in a valid state"),
    IMPORT_JOB_NOT_FOUND(HttpStatus.NOT_FOUND, "Import job not found"),
    IMPORT_MAPPING_INVALID(HttpStatus.UNPROCESSABLE_ENTITY, "Import column mapping is invalid"),
    SCORING_WEIGHTS_INVALID(HttpStatus.UNPROCESSABLE_ENTITY, "Scoring weights must sum to 100"),
    LAST_OWNER_CANNOT_BE_REMOVED(HttpStatus.CONFLICT, "Organization must keep at least one owner");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus status() {
        return status;
    }

    public String defaultMessage() {
        return defaultMessage;
    }
}
