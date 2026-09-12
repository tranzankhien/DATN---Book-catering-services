package org.aplication.backend.common.exception;

import org.aplication.backend.common.constants.ErrorCode;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.context.MessageSource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @ExceptionHandler(CustomBusinessException.class)
    ResponseEntity<Map<String, Object>> handleBusiness(CustomBusinessException exception, Locale locale) {
        return error(exception.getErrorCode(), locale);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception, Locale locale) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors()
                .forEach(error -> fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        Map<String, Object> body = body(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED, locale);
        body.put("fields", fields);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<Map<String, Object>> handleConflict(Locale locale) {
        return error(ErrorCode.DATA_CONFLICT, locale);
    }

    private ResponseEntity<Map<String, Object>> error(ErrorCode errorCode, Locale locale) {
        return ResponseEntity.status(errorCode.getStatusCode()).body(body(errorCode.getStatusCode(), errorCode, locale));
    }

    private Map<String, Object> body(HttpStatus status, ErrorCode errorCode, Locale locale) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now());
        body.put("status", status.value());
        body.put("code", errorCode.name());
        body.put("errorNumber", errorCode.getCode());
        body.put("message", messageSource.getMessage(errorCode.getMessageKey(), null,
                errorCode.name(), locale));
        return body;
    }
}
