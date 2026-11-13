package com.banquethub.modules.payroll.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.modules.payroll.dto.*;
import com.banquethub.modules.payroll.service.PayrollPeriodService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/payroll-periods")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Tag(name = "Admin Payroll Periods", description = "Quản lý kỳ tính lương hàng tháng")
public class AdminPayrollPeriodController {

    private final PayrollPeriodService periodService;

    public AdminPayrollPeriodController(PayrollPeriodService periodService) {
        this.periodService = periodService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách các kỳ tính lương")
    public ResponseEntity<ApiResponse<List<PayrollPeriodDto>>> getPayrollPeriods() {
        List<PayrollPeriodDto> result = periodService.getPayrollPeriods();
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách kỳ lương thành công", result));
    }

    @PostMapping
    @Operation(summary = "Tạo mới kỳ tính lương (tháng/năm)")
    public ResponseEntity<ApiResponse<PayrollPeriodDto>> createPayrollPeriod(
            @Valid @RequestBody CreatePayrollPeriodRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String adminName = userDetails != null ? userDetails.getFullName() : "Admin";
        PayrollPeriodDto result = periodService.createPeriod(request, adminName);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo kỳ lương mới thành công", result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem thông tin chi tiết kỳ tính lương")
    public ResponseEntity<ApiResponse<PayrollPeriodDto>> getPayrollPeriodById(@PathVariable Long id) {
        PayrollPeriodDto result = periodService.getPayrollPeriodById(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin kỳ lương thành công", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật cấu hình ngày công chuẩn cho kỳ lương DRAFT")
    public ResponseEntity<ApiResponse<PayrollPeriodDto>> updatePayrollPeriod(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePayrollPeriodRequest request
    ) {
        PayrollPeriodDto result = periodService.updatePeriod(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật kỳ lương thành công", result));
    }

    @GetMapping("/{id}/preview")
    @Operation(summary = "Xem trước bảng lương tạm tính theo dữ liệu công và phụ cấp/khấu trừ thực tế")
    public ResponseEntity<ApiResponse<PayrollPeriodPreviewDto>> previewPayroll(@PathVariable Long id) {
        PayrollPeriodPreviewDto result = periodService.previewPayroll(id);
        return ResponseEntity.ok(ApiResponse.ok("Tính toán xem trước bảng lương thành công", result));
    }

    @PostMapping("/{id}/finalize")
    @Operation(summary = "Chốt bảng lương chính thức cho kỳ lương (lưu snapshot lịch sử)")
    public ResponseEntity<ApiResponse<List<PayrollDto>>> finalizePayrollPeriod(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String adminName = userDetails != null ? userDetails.getFullName() : "Admin";
        List<PayrollDto> result = periodService.finalizePeriod(id, adminName);
        return ResponseEntity.ok(ApiResponse.ok("Chốt bảng lương kỳ thành công", result));
    }

    @PostMapping("/{id}/close")
    @Operation(summary = "Đóng kỳ lương sau khi 100% nhân viên đã được thanh toán")
    public ResponseEntity<ApiResponse<PayrollPeriodDto>> closePayrollPeriod(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String adminName = userDetails != null ? userDetails.getFullName() : "Admin";
        PayrollPeriodDto result = periodService.closePeriod(id, adminName);
        return ResponseEntity.ok(ApiResponse.ok("Đóng kỳ lương thành công", result));
    }
}
