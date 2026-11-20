package com.banquethub.modules.users.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.modules.users.dto.*;
import com.banquethub.modules.users.entity.Role;
import com.banquethub.modules.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin User Management", description = "Quản lý danh sách, tạo mới, phân quyền, khóa và đặt lại mật khẩu tài khoản người dùng")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tài khoản kèm tìm kiếm, lọc và phân trang")
    public ResponseEntity<ApiResponse<Page<AdminUserSummaryDto>>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<AdminUserSummaryDto> usersPage = userService.getUsers(search, role, active, pageable);
        return ResponseEntity.ok(ApiResponse.ok(usersPage));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết tài khoản, lịch sử đơn hàng và thông tin nhân viên liên kết")
    public ResponseEntity<ApiResponse<AdminUserDetailDto>> getUserDetail(@PathVariable Long id) {
        AdminUserDetailDto detail = userService.getUserDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    @GetMapping("/unlinked-employees")
    @Operation(summary = "Danh sách hồ sơ nhân viên chưa liên kết tài khoản đăng nhập")
    public ResponseEntity<ApiResponse<List<UserEmployeeInfoDto>>> getUnlinkedEmployees(
            @RequestParam(required = false) Long includeUserId
    ) {
        List<UserEmployeeInfoDto> employees = userService.getUnlinkedEmployees(includeUserId);
        return ResponseEntity.ok(ApiResponse.ok(employees));
    }

    @PostMapping
    @Operation(summary = "Admin tạo tài khoản mới và phân quyền (USER, EMPLOYEE, ADMIN)")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request
    ) {
        UserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo tài khoản người dùng thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Chỉnh sửa thông tin, vai trò tài khoản")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        UserResponse response = userService.updateUser(id, request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thông tin tài khoản thành công", response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Khóa hoặc mở khóa tài khoản người dùng")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        UserResponse response = userService.updateUserStatus(id, request, currentUser.getId());
        String msg = Boolean.TRUE.equals(request.getActive())
                ? "Mở khóa kích hoạt tài khoản thành công"
                : "Đã khóa tài khoản thành công";
        return ResponseEntity.ok(ApiResponse.ok(msg, response));
    }

    @PostMapping("/{id}/reset-password")
    @Operation(summary = "Đặt lại mật khẩu cho tài khoản người dùng")
    public ResponseEntity<ApiResponse<AdminResetPasswordResponse>> resetPassword(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) AdminResetPasswordRequest request
    ) {
        AdminResetPasswordResponse response = userService.resetPasswordByAdmin(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Đặt lại mật khẩu thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa tài khoản người dùng (chỉ áp dụng khi chưa phát sinh đơn hàng hay hồ sơ nhân viên)")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        userService.deleteUser(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa tài khoản người dùng thành công", null));
    }
}
