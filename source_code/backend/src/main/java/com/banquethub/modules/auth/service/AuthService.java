package com.banquethub.modules.auth.service;

import com.banquethub.common.exception.DuplicateResourceException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.common.security.JwtTokenProvider;
import com.banquethub.modules.auth.dto.AuthResponse;
import com.banquethub.modules.auth.dto.LoginRequest;
import com.banquethub.modules.auth.dto.RegisterRequest;
import com.banquethub.modules.users.dto.UserResponse;
import com.banquethub.modules.users.entity.Role;
import com.banquethub.modules.users.entity.User;
import com.banquethub.modules.users.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("Email '" + normalizedEmail + "' đã được đăng ký trong hệ thống");
        }

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setRole(Role.ROLE_USER);
        user.setActive(true);

        User saved = userRepository.save(user);
        CustomUserDetails userDetails = new CustomUserDetails(saved);
        String token = jwtTokenProvider.generateToken(userDetails);

        return new AuthResponse(token, jwtTokenProvider.getExpirationMs(), UserResponse.fromEntity(saved));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không chính xác"));

        if (!user.isActive()) {
            throw new BadCredentialsException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Email hoặc mật khẩu không chính xác");
        }

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String token = jwtTokenProvider.generateToken(userDetails);

        return new AuthResponse(token, jwtTokenProvider.getExpirationMs(), UserResponse.fromEntity(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản hiện tại"));
        return UserResponse.fromEntity(user);
    }
}
