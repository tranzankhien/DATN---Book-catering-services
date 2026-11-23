package com.banquethub.modules.reports.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.reports.dto.*;
import com.banquethub.modules.reports.service.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportsController {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final RevenueReportService revenueReportService;
    private final InventoryReportService inventoryReportService;
    private final PayrollReportService payrollReportService;
    private final ProfitReportService profitReportService;
    private final CashFlowReportService cashFlowReportService;
    private final ReportExportService reportExportService;

    public AdminReportsController(
            RevenueReportService revenueReportService,
            InventoryReportService inventoryReportService,
            PayrollReportService payrollReportService,
            ProfitReportService profitReportService,
            CashFlowReportService cashFlowReportService,
            ReportExportService reportExportService
    ) {
        this.revenueReportService = revenueReportService;
        this.inventoryReportService = inventoryReportService;
        this.payrollReportService = payrollReportService;
        this.profitReportService = profitReportService;
        this.cashFlowReportService = cashFlowReportService;
        this.reportExportService = reportExportService;
    }

    // ==========================================
    // REVENUE REPORTS
    // ==========================================

    @GetMapping({"/revenue", "/revenue/summary"})
    public ResponseEntity<ApiResponse<RevenueSummaryResponse>> getRevenue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate end = endDate != null ? endDate : LocalDate.now(VN_ZONE);
        LocalDate start = startDate != null ? startDate : end.withDayOfMonth(1);
        RevenueSummaryResponse summary = revenueReportService.getRevenueSummary(start, end);
        return ResponseEntity.ok(ApiResponse.success(summary, "Tải tổng hợp doanh thu thành công"));
    }

    @GetMapping("/revenue/trend")
    public ResponseEntity<ApiResponse<List<TimeSeriesPoint>>> getRevenueTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate end = endDate != null ? endDate : LocalDate.now(VN_ZONE);
        LocalDate start = startDate != null ? startDate : end.minusDays(29);
        List<TimeSeriesPoint> trend = revenueReportService.getRevenueTrend(start, end);
        return ResponseEntity.ok(ApiResponse.success(trend, "Tải xu hướng doanh thu thành công"));
    }

    @GetMapping("/revenue/top-dishes")
    public ResponseEntity<ApiResponse<List<TopDishReportDto>>> getTopDishes(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "10") int limit
    ) {
        LocalDate end = endDate != null ? endDate : LocalDate.now(VN_ZONE);
        LocalDate start = startDate != null ? startDate : end.withDayOfMonth(1);
        List<TopDishReportDto> dishes = revenueReportService.getTopDishes(start, end, limit);
        return ResponseEntity.ok(ApiResponse.success(dishes, "Tải danh sách món bán chạy thành công"));
    }

    @GetMapping({"/revenue/orders", "/revenue/paid-orders"})
    public ResponseEntity<ApiResponse<Page<PaidOrderReportDto>>> getPaidOrders(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        LocalDate end = endDate != null ? endDate : LocalDate.now(VN_ZONE);
        LocalDate start = startDate != null ? startDate : end.withDayOfMonth(1);
        Page<PaidOrderReportDto> orders = revenueReportService.getPaidOrders(start, end, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(orders, "Tải danh sách đơn đã thanh toán thành công"));
    }

    // ==========================================
    // INVENTORY REPORTS
    // ==========================================

    @GetMapping({"/inventory", "/inventory/overview"})
    public ResponseEntity<ApiResponse<InventoryReportResponse>> getInventory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate end = endDate != null ? endDate : LocalDate.now(VN_ZONE);
        LocalDate start = startDate != null ? startDate : end.withDayOfMonth(1);
        InventoryReportResponse data = inventoryReportService.getInventoryOverview(start, end);
        return ResponseEntity.ok(ApiResponse.success(data, "Tải báo cáo kho thành công"));
    }

    @GetMapping("/inventory/valuation")
    public ResponseEntity<ApiResponse<List<IngredientValuationDto>>> getInventoryValuation() {
        List<IngredientValuationDto> list = inventoryReportService.getIngredientValuationList();
        return ResponseEntity.ok(ApiResponse.success(list, "Tải định giá tồn kho thành công"));
    }

    @GetMapping({"/inventory/purchases", "/inventory/supplier-purchases"})
    public ResponseEntity<ApiResponse<List<SupplierPurchaseDto>>> getSupplierPurchases(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate end = endDate != null ? endDate : LocalDate.now(VN_ZONE);
        LocalDate start = startDate != null ? startDate : end.withDayOfMonth(1);
        List<SupplierPurchaseDto> purchases = inventoryReportService.getSupplierPurchases(start, end);
        return ResponseEntity.ok(ApiResponse.success(purchases, "Tải báo cáo mua hàng nhà cung cấp thành công"));
    }

    // ==========================================
    // PAYROLL REPORTS
    // ==========================================

    @GetMapping({"/payroll", "/payroll/overview"})
    public ResponseEntity<ApiResponse<PayrollReportResponse>> getPayroll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate end = endDate != null ? endDate : LocalDate.now(VN_ZONE);
        LocalDate start = startDate != null ? startDate : end.withDayOfMonth(1);
        PayrollReportResponse data = payrollReportService.getPayrollOverview(start, end);
        return ResponseEntity.ok(ApiResponse.success(data, "Tải báo cáo chi phí lương thành công"));
    }

    @GetMapping({"/payroll/trend", "/payroll/monthly-trend"})
    public ResponseEntity<ApiResponse<List<TimeSeriesPoint>>> getPayrollTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "6") int months
    ) {
        List<TimeSeriesPoint> trend;
        if (startDate != null && endDate != null) {
            trend = payrollReportService.getPayrollTrend(startDate, endDate);
        } else {
            trend = payrollReportService.getPayrollTrend(months);
        }
        return ResponseEntity.ok(ApiResponse.success(trend, "Tải xu hướng chi phí lương thành công"));
    }

    // ==========================================
    // PROFIT REPORTS
    // ==========================================

    @GetMapping("/profit")
    public ResponseEntity<ApiResponse<ProfitReportResponse>> getProfit(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate end = endDate != null ? endDate : LocalDate.now(VN_ZONE);
        LocalDate start = startDate != null ? startDate : end.withDayOfMonth(1);
        ProfitReportResponse data = profitReportService.getProfitReport(start, end);
        return ResponseEntity.ok(ApiResponse.success(data, "Tải báo cáo lợi nhuận ước tính thành công"));
    }

    @GetMapping({"/profit/trend", "/profit/monthly-trend"})
    public ResponseEntity<ApiResponse<List<TimeSeriesPoint>>> getProfitTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "6") int months
    ) {
        List<TimeSeriesPoint> trend;
        if (startDate != null && endDate != null) {
            trend = profitReportService.getProfitTrend(startDate, endDate);
        } else {
            trend = profitReportService.getProfitTrend(months);
        }
        return ResponseEntity.ok(ApiResponse.success(trend, "Tải xu hướng lợi nhuận ước tính thành công"));
    }

    // ==========================================
    // CASH FLOW REPORTS
    // ==========================================

    @GetMapping({"/cashflow", "/cash-flow"})
    public ResponseEntity<ApiResponse<CashFlowReportResponse>> getCashFlow(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate end = endDate != null ? endDate : LocalDate.now(VN_ZONE);
        LocalDate start = startDate != null ? startDate : end.withDayOfMonth(1);
        CashFlowReportResponse data = cashFlowReportService.getCashFlowReport(start, end);
        return ResponseEntity.ok(ApiResponse.success(data, "Tải báo cáo dòng tiền thành công"));
    }

    // ==========================================
    // CSV EXPORT
    // ==========================================

    @GetMapping({"/export", "/export/{typePath}"})
    public ResponseEntity<byte[]> exportCsv(
            @PathVariable(required = false) String typePath,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        String resolvedType = typePath != null && !typePath.isBlank() ? typePath : type;
        if (resolvedType == null || resolvedType.isBlank()) {
            resolvedType = "revenue";
        }
        LocalDate end = endDate != null ? endDate : LocalDate.now(VN_ZONE);
        LocalDate start = startDate != null ? startDate : end.withDayOfMonth(1);
        byte[] csvData = reportExportService.exportCsv(resolvedType, start, end);

        String filename = String.format("banquethub_report_%s_%s.csv",
                resolvedType.toLowerCase(), LocalDate.now(VN_ZONE).format(DateTimeFormatter.ofPattern("yyyyMMdd")));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csvData);
    }
}
