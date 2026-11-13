package com.banquethub.modules.attendance.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.modules.attendance.dto.AttendanceDto;
import com.banquethub.modules.attendance.dto.BulkAttendanceRequest;
import com.banquethub.modules.attendance.dto.CompanyAttendanceSummaryDto;
import com.banquethub.modules.attendance.dto.RecordAttendanceRequest;
import com.banquethub.modules.attendance.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/attendance")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Tag(name = "Admin Attendance", description = "Quản lý chấm công nhân viên hàng ngày")
public class AdminAttendanceController {

    private final AttendanceService attendanceService;

    public AdminAttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách chấm công theo tháng/năm và nhân viên")
    public ResponseEntity<ApiResponse<List<AttendanceDto>>> getAttendance(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Long employeeId
    ) {
        List<AttendanceDto> result = attendanceService.getAttendanceByMonth(year, month, employeeId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy dữ liệu chấm công thành công", result));
    }

    @GetMapping("/summary")
    @Operation(summary = "Lấy bảng tổng hợp công cả tháng của toàn bộ nhân viên")
    public ResponseEntity<ApiResponse<CompanyAttendanceSummaryDto>> getAttendanceSummary(
            @RequestParam int year,
            @RequestParam int month
    ) {
        CompanyAttendanceSummaryDto summary = attendanceService.getMonthlySummary(year, month);
        return ResponseEntity.ok(ApiResponse.ok("Lấy bảng tổng hợp chấm công thành công", summary));
    }

    @PutMapping("/{employeeId}/{date}")
    @Operation(summary = "Chấm công hoặc cập nhật công cho một nhân viên theo ngày")
    public ResponseEntity<ApiResponse<AttendanceDto>> recordAttendance(
            @PathVariable Long employeeId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody RecordAttendanceRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String adminName = userDetails != null ? userDetails.getFullName() : "Admin";
        AttendanceDto result = attendanceService.recordOrUpdateAttendance(employeeId, date, request, adminName);
        return ResponseEntity.ok(ApiResponse.ok("Ghi nhận chấm công thành công", result));
    }

    @PostMapping("/bulk")
    @Operation(summary = "Chấm công hàng loạt cho nhiều nhân viên")
    public ResponseEntity<ApiResponse<List<AttendanceDto>>> recordBulkAttendance(
            @Valid @RequestBody BulkAttendanceRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        String adminName = userDetails != null ? userDetails.getFullName() : "Admin";
        List<AttendanceDto> results = attendanceService.recordBulkAttendance(request, adminName);
        return ResponseEntity.ok(ApiResponse.ok("Ghi nhận chấm công hàng loạt thành công", results));
    }
}
