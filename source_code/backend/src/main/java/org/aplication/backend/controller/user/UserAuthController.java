package org.aplication.backend.controller.user;

import jakarta.validation.Valid;
import org.aplication.backend.common.utils.RefreshTokenCookieUtils;
import org.aplication.backend.dto.request.user.RegisterRequest;
import org.aplication.backend.dto.request.user.UserLoginRequest;
import org.aplication.backend.dto.request.user.RegistrationDetailsRequest;
import org.aplication.backend.dto.request.user.VerifyRegistrationRequest;
import org.aplication.backend.dto.response.shared.AuthResponse;
import org.aplication.backend.dto.response.shared.RegistrationStartedResponse;
import org.aplication.backend.service.interfaces.shared.AuthService;
import org.aplication.backend.service.interfaces.shared.AuthService.AuthResult;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/user")
public class UserAuthController {
    private final AuthService authService;
    private final RefreshTokenCookieUtils cookieUtils;

    public UserAuthController(AuthService authService, RefreshTokenCookieUtils cookieUtils) {
        this.authService = authService;
        this.cookieUtils = cookieUtils;
    }

    @PostMapping("/register/start")
    public ResponseEntity<RegistrationStartedResponse> startRegistration(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.startRegistration(request));
    }

    @PostMapping("/register/details")
    public ResponseEntity<Void> registrationDetails(@Valid @RequestBody RegistrationDetailsRequest request) {
        authService.completeRegistrationDetails(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register/verify")
    public ResponseEntity<AuthResponse> verifyRegistration(@Valid @RequestBody VerifyRegistrationRequest request) {
        return response(authService.verifyRegistration(request), HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody UserLoginRequest request) {
        return response(authService.loginUser(request.email(), request.password()), HttpStatus.OK);
    }

    private ResponseEntity<AuthResponse> response(AuthResult result, HttpStatus status) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, cookieUtils.create(result.refreshToken()))
                .body(result.response());
    }
}
