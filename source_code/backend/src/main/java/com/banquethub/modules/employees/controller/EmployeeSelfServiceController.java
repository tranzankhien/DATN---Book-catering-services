package com.banquethub.modules.employees.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.modules.attendance.dto.AttendanceDto;
import com.banquethub.modules.attendance.dto.AttendanceMonthlySummaryDto;
import com.banquethub.modules.attendance.dto.CompanyAttendanceSummaryDto;
import com.banquethub.modules.attendance.service.AttendanceService;
import com.banquethub.modules.employees.dto.EmployeeDto;
import com.banquethub.modules.employees.service.EmployeeService;
import com.banquethub.modules.payroll.dto.PayrollDto;
import com.banquethub.modules.payroll.service.PayrollService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/employee/me")
@PreAuthorize("hasAnyAuthority('ROLE_EMPLOYEE', 'ROLE_ADMIN')")
@Tag(name = "Employee Self-Service", description = "Cổng thông tin tự phục vụ dành cho nhân viên (Công và Phiếu lương cá nhân)")
public class EmployeeSelfServiceController {

    private final EmployeeService employeeService;
    private final AttendanceService attendanceService;
    private final PayrollService payrollService;

    public EmployeeSelfServiceController(
            EmployeeService employeeService,
            AttendanceService attendanceService,
            PayrollService payrollService
    ) {
        this.employeeService = employeeService;
        this.attendanceService = attendanceService;
        this.payrollService = payrollService;
    }

    @GetMapping
    @Operation(summary = "Xem hồ sơ thông tin cá nhân của nhân viên đang đăng nhập")
    public ResponseEntity<ApiResponse<EmployeeDto>> getMyProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập.");
        }
        EmployeeDto employee = employeeService.getEmployeeByUserId(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin nhân viên thành công", employee));
    }

    @GetMapping("/attendance")
    @Operation(summary = "Xem bảng chấm công cá nhân theo tháng/năm")
    public ResponseEntity<ApiResponse<AttendanceMonthlySummaryDto>> getMyAttendance(
            @RequestParam int year,
            @RequestParam int month,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập.");
        }
        EmployeeDto employee = employeeService.getEmployeeByUserId(userDetails.getId());

        CompanyAttendanceSummaryDto summary = attendanceService.getMonthlySummary(year, month);
        AttendanceMonthlySummaryDto mySummary = summary.employeeSummaries().stream()
                .filter(s -> s.employeeId().equals(employee.id()))
                .findFirst()
                .orElse(new AttendanceMonthlySummaryDto(
                        year,
                        month,
                        employee.id(),
                        employee.employeeCode(),
                        employee.fullName(),
                        employee.position(),
                        0,
                        0,
                        0,
                        java.math.BigDecimal.ZERO,
                        summary.totalDaysInMonth(),
                        java.util.Collections.emptyMap()
                ));

        return ResponseEntity.ok(ApiResponse.ok("Lấy bảng chấm công cá nhân thành công", mySummary));
    }

    @GetMapping("/payrolls")
    @Operation(summary = "Xem danh sách các phiếu lương đã chốt của chính mình")
    public ResponseEntity<ApiResponse<List<PayrollDto>>> getMyPayrolls(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập.");
        }
        EmployeeDto employee = employeeService.getEmployeeByUserId(userDetails.getId());
        List<PayrollDto> myPayrolls = payrollService.getPayrollsByEmployeeId(employee.id());
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách phiếu lương thành công", myPayrolls));
    }

    @GetMapping("/payrolls/{id}")
    @Operation(summary = "Xem chi tiết một phiếu lương cá nhân (chặn tuyệt đối xem của nhân viên khác)")
    public ResponseEntity<ApiResponse<PayrollDto>> getMyPayrollById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new AccessDeniedException("Vui lòng đăng nhập.");
        }
        EmployeeDto employee = employeeService.getEmployeeByUserId(userDetails.getId());

        PayrollDto payroll = payrollService.getPayrollById(id);
        if (!payroll.employeeId().equals(employee.id())) {
            throw new AccessDeniedException("Bạn không có quyền truy cập phiếu lương của nhân viên khác.");
        }

        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết phiếu lương cá nhân thành công", payroll));
    }
}
