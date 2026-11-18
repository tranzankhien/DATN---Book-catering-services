package com.banquethub.modules.reports.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.reports.dto.*;
import com.banquethub.modules.reports.service.DashboardService;
import com.banquethub.modules.reports.service.RevenueReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private final DashboardService dashboardService;
    private final RevenueReportService revenueReportService;

    public AdminDashboardController(DashboardService dashboardService, RevenueReportService revenueReportService) {
        this.dashboardService = dashboardService;
        this.revenueReportService = revenueReportService;
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<DashboardOverviewResponse>> getOverview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate end = endDate != null ? endDate : LocalDate.now(VN_ZONE);
        LocalDate start = startDate != null ? startDate : end.withDayOfMonth(1); // Mặc định từ đầu tháng
        DashboardOverviewResponse data = dashboardService.getOverview(start, end);
        return ResponseEntity.ok(ApiResponse.success(data, "Tải tổng quan kinh doanh thành công"));
    }

    @GetMapping("/revenue-trend")
    public ResponseEntity<ApiResponse<List<TimeSeriesPoint>>> getRevenueTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate end = endDate != null ? endDate : LocalDate.now(VN_ZONE);
        LocalDate start = startDate != null ? startDate : end.minusDays(29); // Mặc định 30 ngày
        List<TimeSeriesPoint> trend = revenueReportService.getRevenueTrend(start, end);
        return ResponseEntity.ok(ApiResponse.success(trend, "Tải xu hướng doanh thu thành công"));
    }

    @GetMapping("/order-status")
    public ResponseEntity<ApiResponse<List<OrderStatusStatDto>>> getOrderStatus(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate end = endDate != null ? endDate : LocalDate.now(VN_ZONE);
        LocalDate start = startDate != null ? startDate : end.withDayOfMonth(1);
        List<OrderStatusStatDto> distribution = dashboardService.getOrderStatusDistribution(start, end);
        return ResponseEntity.ok(ApiResponse.success(distribution, "Tải phân bố trạng thái đơn hàng thành công"));
    }

    @GetMapping("/cost-breakdown")
    public ResponseEntity<ApiResponse<List<CostBreakdownDto>>> getCostBreakdown(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate end = endDate != null ? endDate : LocalDate.now(VN_ZONE);
        LocalDate start = startDate != null ? startDate : end.withDayOfMonth(1);
        List<CostBreakdownDto> breakdown = dashboardService.getCostBreakdown(start, end);
        return ResponseEntity.ok(ApiResponse.success(breakdown, "Tải cơ cấu chi phí thành công"));
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<DashboardAlertDto>>> getAlerts() {
        List<DashboardAlertDto> alerts = dashboardService.getAlerts();
        return ResponseEntity.ok(ApiResponse.success(alerts, "Tải danh sách cảnh báo thành công"));
    }
}
