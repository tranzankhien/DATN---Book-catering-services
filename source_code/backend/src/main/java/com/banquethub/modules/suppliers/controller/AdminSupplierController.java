package com.banquethub.modules.suppliers.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.inventory.dto.StockReceiptResponse;
import com.banquethub.modules.suppliers.dto.SupplierRequest;
import com.banquethub.modules.suppliers.dto.SupplierResponse;
import com.banquethub.modules.suppliers.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/suppliers")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Tag(name = "Admin Suppliers", description = "API Quản trị danh bạ nhà cung cấp nguyên liệu")
public class AdminSupplierController {

    private final SupplierService supplierService;

    public AdminSupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    @Operation(summary = "Admin xem danh sách nhà cung cấp (hỗ trợ tìm kiếm theo tên, sđt, mã)")
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> getSuppliers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean active
    ) {
        return ResponseEntity.ok(ApiResponse.ok(supplierService.searchSuppliers(keyword, active)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Admin xem chi tiết một nhà cung cấp")
    public ResponseEntity<ApiResponse<SupplierResponse>> getSupplierById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(supplierService.getSupplierById(id)));
    }

    @GetMapping("/{id}/receipts")
    @Operation(summary = "Admin xem danh sách các phiếu nhập hàng từ nhà cung cấp")
    public ResponseEntity<ApiResponse<List<StockReceiptResponse>>> getSupplierReceipts(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(supplierService.getSupplierReceipts(id)));
    }

    @PostMapping
    @Operation(summary = "Admin thêm nhà cung cấp mới")
    public ResponseEntity<ApiResponse<SupplierResponse>> createSupplier(@Valid @RequestBody SupplierRequest request) {
        SupplierResponse created = supplierService.createSupplier(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Thêm nhà cung cấp mới thành công", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Admin cập nhật thông tin nhà cung cấp")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody SupplierRequest request
    ) {
        SupplierResponse updated = supplierService.updateSupplier(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật nhà cung cấp thành công", updated));
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Admin bật/tắt trạng thái hoạt động nhà cung cấp")
    public ResponseEntity<ApiResponse<SupplierResponse>> toggleSupplierActive(@PathVariable Long id) {
        SupplierResponse updated = supplierService.toggleSupplierActive(id);
        String msg = updated.isActive()
                ? "Đã kích hoạt lại nhà cung cấp"
                : "Đã tạm dừng hoạt động nhà cung cấp";
        return ResponseEntity.ok(ApiResponse.ok(msg, updated));
    }
}

