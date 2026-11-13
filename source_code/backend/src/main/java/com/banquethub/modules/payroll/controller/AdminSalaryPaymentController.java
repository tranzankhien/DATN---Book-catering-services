package com.banquethub.modules.payroll.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.payroll.dto.SalaryPaymentDto;
import com.banquethub.modules.payroll.service.SalaryPaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/salary-payments")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Tag(name = "Admin Salary Payments", description = "Lịch sử các giao dịch ghi nhận chi trả lương")
public class AdminSalaryPaymentController {

    private final SalaryPaymentService salaryPaymentService;

    public AdminSalaryPaymentController(SalaryPaymentService salaryPaymentService) {
        this.salaryPaymentService = salaryPaymentService;
    }

    @GetMapping
    @Operation(summary = "Lấy toàn bộ lịch sử ghi nhận chi trả lương")
    public ResponseEntity<ApiResponse<List<SalaryPaymentDto>>> getAllPayments() {
        List<SalaryPaymentDto> result = salaryPaymentService.getAllPayments();
        return ResponseEntity.ok(ApiResponse.ok("Lấy lịch sử chi trả lương thành công", result));
    }
}
