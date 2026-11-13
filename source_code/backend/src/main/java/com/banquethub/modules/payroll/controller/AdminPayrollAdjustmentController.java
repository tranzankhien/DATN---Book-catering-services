package com.banquethub.modules.payroll.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.modules.payroll.dto.CreatePayrollAdjustmentRequest;
import com.banquethub.modules.payroll.dto.PayrollAdjustmentDto;
import com.banquethub.modules.payroll.dto.UpdatePayrollAdjustmentRequest;
import com.banquethub.modules.payroll.service.PayrollAdjustmentService;
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
@RequestMapping("/api/v1/admin/payroll-adjustments")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Tag(name = "Admin Payroll Adjustments", description = "Quản lý các khoản phụ cấp và khấu trừ lương")
public class AdminPayrollAdjustmentController {

    private final PayrollAdjustmentService adjustmentService;

    public AdminPayrollAdjustmentController(PayrollAdjustmentService adjustmentService) {
        this.adjustmentService = adjustmentService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách phụ cấp/khấu trừ theo kỳ lương và nhân viên")
    public ResponseEntity<ApiResponse<List<PayrollAdjustmentDto>>> getAdjustments(
            @RequestParam Long payrollPeriodId,
            @RequestParam(required = false) Long employeeId
    ) {
        List<PayrollAdjustmentDto> result = adjustmentService.getAdjustments(payrollPeriodId, employeeId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách điều chỉnh lương thành công", result));
    }

    @PostMapping
    @Operation(summary = "Thêm khoản phụ cấp hoặc khấu trừ cho nhân viên trong kỳ lương DRAFT")
    public ResponseEntity<ApiResponse<PayrollAdjustmentDto>> createAdjustment(
            @Valid @RequestBody CreatePayrollAdjustmentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String adminName = userDetails != null ? userDetails.getFullName() : "Admin";
        PayrollAdjustmentDto result = adjustmentService.createAdjustment(request, adminName);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Thêm khoản điều chỉnh thành công", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật khoản phụ cấp hoặc khấu trừ khi kỳ lương chưa chốt")
    public ResponseEntity<ApiResponse<PayrollAdjustmentDto>> updateAdjustment(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePayrollAdjustmentRequest request
    ) {
        PayrollAdjustmentDto result = adjustmentService.updateAdjustment(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật khoản điều chỉnh thành công", result));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa khoản phụ cấp hoặc khấu trừ khi kỳ lương chưa chốt")
    public ResponseEntity<ApiResponse<Void>> deleteAdjustment(@PathVariable Long id) {
        adjustmentService.deleteAdjustment(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa khoản điều chỉnh thành công", null));
    }
}
