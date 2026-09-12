package org.aplication.backend.common.exception;

import org.aplication.backend.common.constants.ErrorCode;
import org.springframework.http.HttpStatus;

public class CustomBusinessException extends RuntimeException {
    private final ErrorCode errorCode;

    public CustomBusinessException(ErrorCode errorCode) {
        super(errorCode.name());
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() { return errorCode; }
    public HttpStatus getStatus() { return errorCode.getStatusCode(); }
    public String getCode() { return errorCode.name(); }
    public int getNumericCode() { return errorCode.getCode(); }
}
