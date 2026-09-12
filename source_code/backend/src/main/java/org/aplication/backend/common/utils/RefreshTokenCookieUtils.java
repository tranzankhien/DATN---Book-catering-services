package org.aplication.backend.common.utils;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class RefreshTokenCookieUtils {
    public static final String COOKIE_NAME = "refresh_token";

    private final boolean secure;
    private final Duration maxAge;

    public RefreshTokenCookieUtils(@Value("${auth.refresh-cookie-secure}") boolean secure,
                                   @Value("${jwt.refresh-ttl-seconds}") long refreshTtlSeconds) {
        this.secure = secure;
        this.maxAge = Duration.ofSeconds(refreshTtlSeconds);
    }

    public String create(String refreshToken) {
        return cookie(refreshToken, maxAge).toString();
    }

    public String clear() {
        return cookie("", Duration.ZERO).toString();
    }

    private ResponseCookie cookie(String value, Duration age) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(age)
                .build();
    }
}
