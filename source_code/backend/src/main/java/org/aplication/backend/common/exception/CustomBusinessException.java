package org.aplication.backend.common.exception;

public class CustomBusinessException extends RuntimeException {
    public CustomBusinessException(String message) {
        super(message);
    }
}
