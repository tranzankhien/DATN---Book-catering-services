package com.banquethub.common.exception;

import com.banquethub.common.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        return buildError(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicate(DuplicateResourceException ex, HttpServletRequest request) {
        return buildError(HttpStatus.CONFLICT, "CONFLICT", ex.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(BusinessValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessValidation(BusinessValidationException ex, HttpServletRequest request) {
        return buildError(HttpStatus.BAD_REQUEST, "BUSINESS_RULE_VIOLATION", ex.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        String firstMsg = fieldErrors.values().stream().findFirst().orElse("Dữ liệu đầu vào không hợp lệ");
        return buildError(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", firstMsg, request.getRequestURI(), fieldErrors);
    }

    @ExceptionHandler({HandlerMethodValidationException.class, ConstraintViolationException.class})
    public ResponseEntity<ApiErrorResponse> handleMethodValidation(Exception ex, HttpServletRequest request) {
        return buildError(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu đầu vào không hợp lệ: " + ex.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return buildError(HttpStatus.BAD_REQUEST, "INVALID_JSON", "Định dạng dữ liệu JSON gửi lên không hợp lệ", request.getRequestURI(), null);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        return buildError(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", ex.getMessage(), request.getRequestURI(), null);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        return buildError(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "Vui lòng đăng nhập để thực hiện chức năng này", request.getRequestURI(), null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        return buildError(HttpStatus.FORBIDDEN, "FORBIDDEN", "Bạn không có quyền truy cập tài nguyên này", request.getRequestURI(), null);
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatus(org.springframework.web.server.ResponseStatusException ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;
        String reason = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        return buildError(status, status.name(), reason, request.getRequestURI(), null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.", request.getRequestURI(), null);
    }

    private ResponseEntity<ApiErrorResponse> buildError(
            HttpStatus status,
            String error,
            String message,
            String path,
            Map<String, String> validationErrors
    ) {
        ApiErrorResponse body = new ApiErrorResponse(status.value(), error, message, path, validationErrors);
        return ResponseEntity.status(status).body(body);
    }
}
