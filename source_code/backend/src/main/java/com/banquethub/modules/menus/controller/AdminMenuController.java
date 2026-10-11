package com.banquethub.modules.menus.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.menus.dto.CreateMenuRequest;
import com.banquethub.modules.menus.dto.MenuResponse;
import com.banquethub.modules.menus.dto.UpdateMenuRequest;
import com.banquethub.modules.menus.dto.UpdateMenuStatusRequest;
import com.banquethub.modules.menus.entity.MenuStatus;
import com.banquethub.modules.menus.service.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/menus")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Quản Lý Thực Đơn", description = "APIs CRUD thực đơn mẫu dành riêng cho Quản trị viên")
public class AdminMenuController {

    private final MenuService menuService;

    public AdminMenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping
    @Operation(summary = "Tìm kiếm và phân trang thực đơn mẫu")
    public ResponseEntity<ApiResponse<Page<MenuResponse>>> searchMenus(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) MenuStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = "asc".equalsIgnoreCase(direction) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Page<MenuResponse> result = menuService.searchAdminMenus(keyword, status, PageRequest.of(page, size, sort));
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách thực đơn thành công", result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết thực đơn cho admin")
    public ResponseEntity<ApiResponse<MenuResponse>> getMenuById(@PathVariable Long id) {
        MenuResponse menu = menuService.getMenuById(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin thực đơn thành công", menu));
    }

    @PostMapping
    @Operation(summary = "Tạo mới thực đơn mẫu")
    public ResponseEntity<ApiResponse<MenuResponse>> createMenu(@Valid @RequestBody CreateMenuRequest request) {
        MenuResponse created = menuService.createMenu(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo thực đơn mẫu thành công", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thực đơn mẫu")
    public ResponseEntity<ApiResponse<MenuResponse>> updateMenu(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMenuRequest request
    ) {
        MenuResponse updated = menuService.updateMenu(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thực đơn thành công", updated));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái thực đơn (ACTIVE / HIDDEN / ARCHIVED)")
    public ResponseEntity<ApiResponse<MenuResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMenuStatusRequest request
    ) {
        MenuResponse updated = menuService.updateMenuStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thực đơn thành công", updated));
    }
}
