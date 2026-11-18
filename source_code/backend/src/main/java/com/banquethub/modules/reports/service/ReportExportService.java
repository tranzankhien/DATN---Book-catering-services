package com.banquethub.modules.reports.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.modules.reports.dto.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReportExportService {

    private final RevenueReportService revenueReportService;
    private final InventoryReportService inventoryReportService;
    private final ProfitReportService profitReportService;
    private final CashFlowReportService cashFlowReportService;

    public ReportExportService(
            RevenueReportService revenueReportService,
            InventoryReportService inventoryReportService,
            ProfitReportService profitReportService,
            CashFlowReportService cashFlowReportService
    ) {
        this.revenueReportService = revenueReportService;
        this.inventoryReportService = inventoryReportService;
        this.profitReportService = profitReportService;
        this.cashFlowReportService = cashFlowReportService;
    }

    public byte[] exportCsv(String type, LocalDate startDate, LocalDate endDate) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
            // Write UTF-8 BOM so Excel opens Vietnamese characters correctly
            writer.write('\uFEFF');

            switch (type.toUpperCase()) {
                case "REVENUE":
                    exportRevenueCsv(writer, startDate, endDate);
                    break;
                case "INVENTORY":
                    exportInventoryCsv(writer);
                    break;
                case "PROFIT":
                    exportProfitCsv(writer, startDate, endDate);
                    break;
                case "CASHFLOW":
                    exportCashFlowCsv(writer, startDate, endDate);
                    break;
                default:
                    throw new BusinessValidationException("Loại báo cáo không hỗ trợ: " + type);
            }
            writer.flush();
        }
        return baos.toByteArray();
    }

    private void exportRevenueCsv(PrintWriter writer, LocalDate startDate, LocalDate endDate) {
        writer.println("Mã đơn hàng,Khách hàng,Số điện thoại,Số bàn,Ngày thanh toán,Ngày tổ chức,Doanh thu (VND),Giá vốn nguyên liệu (VND),Lợi nhuận gộp (VND),Biên lợi nhuận (%)");
        var page = revenueReportService.getPaidOrders(startDate, endDate, PageRequest.of(0, 5000));
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        for (PaidOrderReportDto o : page.getContent()) {
            writer.printf("%s,%s,%s,%d,%s,%s,%s,%s,%s,%.2f\n",
                    escapeCsv(o.getOrderCode()),
                    escapeCsv(o.getCustomerName()),
                    escapeCsv(o.getCustomerPhone()),
                    o.getTableCount() != null ? o.getTableCount() : 0,
                    o.getPaidAt() != null ? o.getPaidAt().format(dtf) : "",
                    o.getEventDateTime() != null ? o.getEventDateTime().format(dtf) : "",
                    o.getTotalAmount() != null ? o.getTotalAmount().toPlainString() : "0",
                    o.getCogs() != null ? o.getCogs().toPlainString() : "0",
                    o.getGrossProfit() != null ? o.getGrossProfit().toPlainString() : "0",
                    o.getGrossMargin() != null ? o.getGrossMargin() : 0.0
            );
        }
    }

    private void exportInventoryCsv(PrintWriter writer) {
        writer.println("Mã nguyên liệu,Tên nguyên liệu,Đơn vị,Tồn kho hiện tại,Giá vốn bình quân (VND),Tổng giá trị tồn (VND),Ngưỡng tối thiểu,Trạng thái");
        List<IngredientValuationDto> list = inventoryReportService.getIngredientValuationList();

        for (IngredientValuationDto i : list) {
            writer.printf("%d,%s,%s,%s,%s,%s,%s,%s\n",
                    i.getIngredientId(),
                    escapeCsv(i.getName()),
                    escapeCsv(i.getUnit()),
                    i.getCurrentStock() != null ? i.getCurrentStock().stripTrailingZeros().toPlainString() : "0",
                    i.getAvgUnitCost() != null ? i.getAvgUnitCost().toPlainString() : "0",
                    i.getTotalValue() != null ? i.getTotalValue().toPlainString() : "0",
                    i.getMinStockThreshold() != null ? i.getMinStockThreshold().stripTrailingZeros().toPlainString() : "0",
                    i.isLowStock() ? "DƯỚI NGƯỠNG" : "AN TOÀN"
            );
        }
    }

    private void exportProfitCsv(PrintWriter writer, LocalDate startDate, LocalDate endDate) {
        writer.println("Kỳ tháng,Doanh thu đã thanh toán (VND),Giá vốn nguyên liệu (VND),Lợi nhuận gộp (VND),Chi phí lương nội bộ (VND),Chi phí vận hành khác (VND),Lợi nhuận ước tính (VND)");
        ProfitReportResponse profit = profitReportService.getProfitReport(startDate, endDate);

        for (MonthlyProfitBreakdownDto m : profit.getMonthlyBreakdown()) {
            writer.printf("%s,%s,%s,%s,%s,%s,%s\n",
                    escapeCsv(m.getMonthYear()),
                    m.getRevenue() != null ? m.getRevenue().toPlainString() : "0",
                    m.getMaterialCost() != null ? m.getMaterialCost().toPlainString() : "0",
                    m.getGrossProfit() != null ? m.getGrossProfit().toPlainString() : "0",
                    m.getPayrollCost() != null ? m.getPayrollCost().toPlainString() : "0",
                    m.getOperatingExpense() != null ? m.getOperatingExpense().toPlainString() : "0",
                    m.getEstimatedProfit() != null ? m.getEstimatedProfit().toPlainString() : "0"
            );
        }
    }

    private void exportCashFlowCsv(PrintWriter writer, LocalDate startDate, LocalDate endDate) {
        writer.println("Ngày,Dòng tiền thu mô phỏng (VND),Chi trả nhà cung cấp (VND),Chi trả lương nhân viên (VND),Chi phí vận hành đã trả (VND),Dòng tiền thuần mô phỏng (VND)");
        CashFlowReportResponse cf = cashFlowReportService.getCashFlowReport(startDate, endDate);

        for (TimeSeriesPoint pt : cf.getDailyCashFlow()) {
            BigDecimal inVal = pt.getValue();
            BigDecimal outVal = pt.getSecondaryValue();
            BigDecimal net = pt.getThirdValue();

            writer.printf("%s,%s,%s,%s,%s,%s\n",
                    escapeCsv(pt.getDate()),
                    inVal != null ? inVal.toPlainString() : "0",
                    "-",
                    "-",
                    outVal != null ? outVal.toPlainString() : "0",
                    net != null ? net.toPlainString() : "0"
            );
        }
    }

    private String escapeCsv(String input) {
        if (input == null) return "";
        String sanitized = input.trim();
        // Prevent CSV Formula Injection
        if (sanitized.startsWith("=") || sanitized.startsWith("+") || sanitized.startsWith("-") || sanitized.startsWith("@")) {
            sanitized = "'" + sanitized;
        }
        if (sanitized.contains(",") || sanitized.contains("\"") || sanitized.contains("\n") || sanitized.contains("\r")) {
            sanitized = "\"" + sanitized.replace("\"", "\"\"") + "\"";
        }
        return sanitized;
    }
}
