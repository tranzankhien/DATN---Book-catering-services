package com.banquethub.modules.auth.dto;

import com.banquethub.modules.users.dto.UserResponse;

public class AuthResponse {

    private String accessToken;
    private String tokenType = "Bearer";
    private long expiresInMs;
    private UserResponse user;
    private boolean emailVerificationRequired;
    private String devVerificationCode;

    public AuthResponse() {
    }

    public AuthResponse(String accessToken, long expiresInMs, UserResponse user) {
        this.accessToken = accessToken;
        this.tokenType = "Bearer";
        this.expiresInMs = expiresInMs;
        this.user = user;
    }

    public AuthResponse(String accessToken, long expiresInMs, UserResponse user, boolean emailVerificationRequired, String devVerificationCode) {
        this.accessToken = accessToken;
        this.tokenType = "Bearer";
        this.expiresInMs = expiresInMs;
        this.user = user;
        this.emailVerificationRequired = emailVerificationRequired;
        this.devVerificationCode = devVerificationCode;
    }

    public boolean isEmailVerificationRequired() {
        return emailVerificationRequired;
    }

    public void setEmailVerificationRequired(boolean emailVerificationRequired) {
        this.emailVerificationRequired = emailVerificationRequired;
    }

    public String getDevVerificationCode() {
        return devVerificationCode;
    }

    public void setDevVerificationCode(String devVerificationCode) {
        this.devVerificationCode = devVerificationCode;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public long getExpiresInMs() {
        return expiresInMs;
    }

    public void setExpiresInMs(long expiresInMs) {
        this.expiresInMs = expiresInMs;
    }

    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }
}
