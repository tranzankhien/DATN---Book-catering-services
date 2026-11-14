package com.banquethub.modules.payroll.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.modules.payroll.dto.PayrollDto;
import com.banquethub.modules.payroll.dto.PayrollSummaryDto;
import com.banquethub.modules.payroll.dto.RecordSalaryPaymentRequest;
import com.banquethub.modules.payroll.dto.SalaryPaymentDto;
import com.banquethub.modules.payroll.entity.PaymentStatus;
import com.banquethub.modules.payroll.service.PayrollService;
import com.banquethub.modules.payroll.service.SalaryPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/payrolls")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Tag(name = "Admin Payrolls", description = "Quản lý bảng lương nhân viên và ghi nhận chi trả")
public class AdminPayrollController {

    private final PayrollService payrollService;
    private final SalaryPaymentService paymentService;

    public AdminPayrollController(PayrollService payrollService, SalaryPaymentService paymentService) {
        this.payrollService = payrollService;
        this.paymentService = paymentService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách bảng lương có phân trang và bộ lọc")
    public ResponseEntity<ApiResponse<Page<PayrollDto>>> getPayrolls(
            @RequestParam(required = false) Long payrollPeriodId,
            @RequestParam(required = false) Long periodId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) PaymentStatus paymentStatus,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Long targetPeriodId = payrollPeriodId != null ? payrollPeriodId : periodId;
        Page<PayrollDto> result = payrollService.getPayrolls(targetPeriodId, year, month, paymentStatus, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách bảng lương thành công", result));
    }

    @GetMapping("/summary")
    @Operation(summary = "Lấy dữ liệu tổng hợp chi phí lương và dòng tiền thanh toán (phục vụ Dashboard)")
    public ResponseEntity<ApiResponse<PayrollSummaryDto>> getPayrollSummary(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        PayrollSummaryDto summary = payrollService.getPayrollSummary(year, month);
        return ResponseEntity.ok(ApiResponse.ok("Lấy dữ liệu tổng hợp lương thành công", summary));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết bảng lương của nhân viên")
    public ResponseEntity<ApiResponse<PayrollDto>> getPayrollById(@PathVariable Long id) {
        PayrollDto result = payrollService.getPayrollById(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết bảng lương thành công", result));
    }

    @PostMapping("/{id}/mark-paid")
    @Operation(summary = "Ghi nhận thanh toán toàn bộ lương cho nhân viên (nghiệp vụ thủ công, không gọi ngân hàng)")
    public ResponseEntity<ApiResponse<SalaryPaymentDto>> markPayrollPaid(
            @PathVariable Long id,
            @Valid @RequestBody RecordSalaryPaymentRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String adminName = userDetails != null ? userDetails.getFullName() : "Admin";
        SalaryPaymentDto result = paymentService.recordPayment(id, request, adminName);
        return ResponseEntity.ok(ApiResponse.ok("Đã ghi nhận thanh toán lương thành công", result));
    }
}
