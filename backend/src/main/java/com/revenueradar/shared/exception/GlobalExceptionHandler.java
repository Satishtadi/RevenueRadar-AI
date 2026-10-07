package com.revenueradar.shared.exception;

import com.revenueradar.shared.api.ApiErrorResponse;
import com.revenueradar.shared.api.ApiErrorResponse.FieldViolation;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;

/**
 * Converts every exception into the standard error envelope.
 * Stack traces are logged server-side only, never returned to the client.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiErrorResponse> handleAppException(AppException ex) {
        ErrorCode code = ex.errorCode();
        HttpStatus status = code.status();

        // 4xx are expected behaviour -> WARN would be noise; keep DEBUG for domain misses
        if (status.is5xxServerError()) {
            log.error("operation=handle_exception error_code={} message={}", code, ex.getMessage(), ex);
        } else {
            log.debug("operation=handle_exception error_code={} message={}", code, ex.getMessage());
        }
        return build(status, code.name(), ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        List<FieldViolation> violations = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new FieldViolation(fe.getField(), fe.getDefaultMessage()))
                .toList();
        log.debug("operation=handle_validation errors={}", violations.size());
        return build(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR.name(),
                ErrorCode.VALIDATION_ERROR.defaultMessage(), violations);
    }

    @ExceptionHandler({
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class
    })
    public ResponseEntity<ApiErrorResponse> handleBadRequest(Exception ex) {
        log.debug("operation=handle_bad_request type={}", ex.getClass().getSimpleName());
        String message = ex instanceof MissingServletRequestParameterException m
                ? "Missing required parameter: " + m.getParameterName()
                : ErrorCode.MALFORMED_REQUEST.defaultMessage();
        return build(HttpStatus.BAD_REQUEST, ErrorCode.MALFORMED_REQUEST.name(), message);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        log.debug("operation=handle_bad_credentials");
        return build(HttpStatus.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS.name(),
                ErrorCode.INVALID_CREDENTIALS.defaultMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthentication(AuthenticationException ex) {
        log.debug("operation=handle_authentication type={}", ex.getClass().getSimpleName());
        return build(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED.name(),
                ErrorCode.UNAUTHORIZED.defaultMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex) {
        log.debug("operation=handle_access_denied");
        return build(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN.name(), ErrorCode.FORBIDDEN.defaultMessage());
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiErrorResponse> handleDisabled(DisabledException ex) {
        return build(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN.name(), "Account is disabled");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResource(NoResourceFoundException ex) {
        return build(HttpStatus.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND.name(),
                ErrorCode.RESOURCE_NOT_FOUND.defaultMessage());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, "METHOD_NOT_ALLOWED",
                "Method " + ex.getMethod() + " is not supported");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("operation=handle_data_integrity detail={}", safeConstraintMessage(ex));
        return build(HttpStatus.CONFLICT, ErrorCode.CONFLICT.name(), ErrorCode.CONFLICT.defaultMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("operation=handle_illegal_argument message={}", ex.getMessage());
        return build(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR.name(),
                ex.getMessage() != null ? ex.getMessage() : ErrorCode.VALIDATION_ERROR.defaultMessage());
    }

    /**
     * Safety net. Any exception reaching here is a bug — log it fully, return nothing but the envelope.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("operation=unhandled_exception path={} method={} request_id={}",
                request.getRequestURI(), request.getMethod(), MDC.get("requestId"), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR.name(),
                ErrorCode.INTERNAL_ERROR.defaultMessage());
    }

    private static ResponseEntity<ApiErrorResponse> build(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(ApiErrorResponse.of(code, message));
    }

    private static ResponseEntity<ApiErrorResponse> build(HttpStatus status, String code, String message,
                                                          List<FieldViolation> violations) {
        return ResponseEntity.status(status).body(ApiErrorResponse.of(code, message, violations));
    }

    private static String safeConstraintMessage(DataIntegrityViolationException ex) {
        String msg = ex.getMostSpecificCause().getMessage();
        if (msg == null) {
            return "constraint violation";
        }
        // never log full row values — constraint name is enough
        return msg.length() > 200 ? msg.substring(0, 200) : msg;
    }
}
