package com.banquethub.modules.users.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.modules.users.dto.ChangePasswordRequest;
import com.banquethub.modules.users.dto.UpdateProfileRequest;
import com.banquethub.modules.users.dto.UserResponse;
import com.banquethub.modules.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@Tag(name = "User Profile & Security", description = "Xem/cập nhật thông tin cá nhân và đổi mật khẩu cho người dùng hiện tại")
public class UserProfileController {

    private final UserService userService;

    public UserProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping({"/api/v1/users/profile", "/api/v1/auth/profile"})
    @Operation(summary = "Xem thông tin cá nhân của người dùng hiện tại")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        UserResponse response = userService.getProfile(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping({"/api/v1/users/profile", "/api/v1/auth/profile"})
    @Operation(summary = "Chỉnh sửa họ tên, số điện thoại của người dùng hiện tại")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UserResponse response = userService.updateProfile(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thông tin cá nhân thành công", response));
    }

    @PostMapping({"/api/v1/users/change-password", "/api/v1/auth/change-password"})
    @Operation(summary = "Đổi mật khẩu người dùng (yêu cầu mật khẩu hiện tại)")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok("Đổi mật khẩu thành công. Vui lòng sử dụng mật khẩu mới cho lần đăng nhập kế tiếp.", null));
    }
}
