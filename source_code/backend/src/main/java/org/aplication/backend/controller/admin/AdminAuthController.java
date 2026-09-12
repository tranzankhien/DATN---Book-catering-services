package org.aplication.backend.controller.admin;

import jakarta.validation.Valid;
import org.aplication.backend.common.utils.RefreshTokenCookieUtils;
import org.aplication.backend.dto.request.admin.AdminLoginRequest;
import org.aplication.backend.dto.response.shared.AuthResponse;
import org.aplication.backend.service.interfaces.shared.AuthService;
import org.aplication.backend.service.interfaces.shared.AuthService.AuthResult;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/admin")
public class AdminAuthController {
    private final AuthService authService;
    private final RefreshTokenCookieUtils cookieUtils;

    public AdminAuthController(AuthService authService, RefreshTokenCookieUtils cookieUtils) {
        this.authService = authService;
        this.cookieUtils = cookieUtils;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AdminLoginRequest request) {
        AuthResult result = authService.loginAdminOrStaff(request.email(), request.password());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookieUtils.create(result.refreshToken()))
                .body(result.response());
    }
}
