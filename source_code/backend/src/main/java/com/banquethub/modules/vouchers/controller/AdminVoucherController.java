package com.banquethub.modules.vouchers.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.vouchers.dto.CreateVoucherRequest;
import com.banquethub.modules.vouchers.dto.UpdateVoucherRequest;
import com.banquethub.modules.vouchers.dto.VoucherDto;
import com.banquethub.modules.vouchers.service.VoucherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/vouchers")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Voucher Management", description = "Quản lý mã voucher, chương trình ưu đãi và khuyến mãi yến tiệc")
public class AdminVoucherController {

    private final VoucherService voucherService;

    public AdminVoucherController(VoucherService voucherService) {
        this.voucherService = voucherService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả mã voucher trên hệ thống")
    public ResponseEntity<ApiResponse<List<VoucherDto>>> getAllVouchers() {
        List<VoucherDto> vouchers = voucherService.getAllVouchers();
        return ResponseEntity.ok(ApiResponse.success(vouchers));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một mã voucher")
    public ResponseEntity<ApiResponse<VoucherDto>> getVoucherById(@PathVariable Long id) {
        VoucherDto voucher = voucherService.getVoucherById(id);
        return ResponseEntity.ok(ApiResponse.success(voucher));
    }

    @PostMapping
    @Operation(summary = "Tạo mới một mã voucher khuyến mãi")
    public ResponseEntity<ApiResponse<VoucherDto>> createVoucher(@Valid @RequestBody CreateVoucherRequest request) {
        VoucherDto created = voucherService.createVoucher(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin mã voucher")
    public ResponseEntity<ApiResponse<VoucherDto>> updateVoucher(
            @PathVariable Long id,
            @Valid @RequestBody UpdateVoucherRequest request
    ) {
        VoucherDto updated = voucherService.updateVoucher(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @PatchMapping("/{id}/toggle-status")
    @Operation(summary = "Bật/Tắt trạng thái kích hoạt của mã voucher")
    public ResponseEntity<ApiResponse<VoucherDto>> toggleVoucherStatus(@PathVariable Long id) {
        VoucherDto updated = voucherService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mã voucher (chỉ cho phép khi chưa có đơn hàng nào sử dụng)")
    public ResponseEntity<ApiResponse<Void>> deleteVoucher(@PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
