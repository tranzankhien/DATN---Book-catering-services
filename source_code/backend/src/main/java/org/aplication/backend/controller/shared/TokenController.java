package org.aplication.backend.controller.shared;

import static org.aplication.backend.common.utils.RefreshTokenCookieUtils.COOKIE_NAME;
import static org.aplication.backend.common.constants.ErrorCode.AUTH_INVALID_TOKEN;

import org.aplication.backend.common.exception.CustomBusinessException;
import org.aplication.backend.common.utils.RefreshTokenCookieUtils;
import org.aplication.backend.dto.response.shared.AuthResponse;
import org.aplication.backend.service.interfaces.shared.AuthService;
import org.aplication.backend.service.interfaces.shared.AuthService.AuthResult;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class TokenController {
    private final AuthService authService;
    private final RefreshTokenCookieUtils cookieUtils;

    public TokenController(AuthService authService, RefreshTokenCookieUtils cookieUtils) {
        this.authService = authService;
        this.cookieUtils = cookieUtils;
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = COOKIE_NAME, required = false) String refreshToken) {
        AuthResult result = authService.refresh(requireRefreshToken(refreshToken));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookieUtils.create(result.refreshToken()))
                .body(result.response());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                                       @CookieValue(name = COOKIE_NAME, required = false) String refreshToken) {
        authService.logout(authorization.substring(7), requireRefreshToken(refreshToken));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookieUtils.clear())
                .build();
    }

    private String requireRefreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new CustomBusinessException(AUTH_INVALID_TOKEN);
        }
        return refreshToken;
    }
}
