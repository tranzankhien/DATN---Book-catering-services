package com.banquethub.modules.menus.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.menus.dto.MenuResponse;
import com.banquethub.modules.menus.service.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/menus")
@Tag(name = "Thực Đơn Mẫu (Public)", description = "APIs xem danh sách và chi tiết thực đơn tiệc mẫu cho khách hàng")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách thực đơn mẫu đang hoạt động")
    public ResponseEntity<ApiResponse<List<MenuResponse>>> getActiveMenus() {
        List<MenuResponse> menus = menuService.getActiveMenus();
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách thực đơn thành công", menus));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết thực đơn theo ID")
    public ResponseEntity<ApiResponse<MenuResponse>> getMenuById(@PathVariable Long id) {
        MenuResponse menu = menuService.getPublicMenuById(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết thực đơn thành công", menu));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Lấy chi tiết thực đơn theo mã")
    public ResponseEntity<ApiResponse<MenuResponse>> getMenuByCode(@PathVariable String code) {
        MenuResponse menu = menuService.getPublicMenuByCode(code);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết thực đơn thành công", menu));
    }
}
