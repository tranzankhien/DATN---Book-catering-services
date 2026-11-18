package com.banquethub.modules.reports.service;

import com.banquethub.modules.reports.dto.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private final JdbcTemplate jdbcTemplate;
    private final ProfitReportService profitReportService;

    public DashboardService(JdbcTemplate jdbcTemplate, ProfitReportService profitReportService) {
        this.jdbcTemplate = jdbcTemplate;
        this.profitReportService = profitReportService;
    }

    public DashboardOverviewResponse getOverview(LocalDate startDate, LocalDate endDate) {
        OffsetDateTime start = startDate.atStartOfDay(VN_ZONE).toOffsetDateTime();
        OffsetDateTime end = endDate.plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();

        DashboardOverviewResponse resp = new DashboardOverviewResponse();

        // 1. Doanh thu & Đơn hàng đã thanh toán
        String orderSummarySql = "SELECT " +
                "  COUNT(CASE WHEN payment_status = 'PAID' AND paid_at >= ? AND paid_at < ? THEN 1 END) AS paid_cnt, " +
                "  COALESCE(SUM(CASE WHEN payment_status = 'PAID' AND paid_at >= ? AND paid_at < ? THEN total_amount ELSE 0 END), 0) AS paid_rev, " +
                "  COUNT(CASE WHEN order_status IN ('CONFIRMED', 'PROCESSING') THEN 1 END) AS prep_cnt, " +
                "  COUNT(CASE WHEN order_status = 'COMPLETED' THEN 1 END) AS comp_cnt " +
                "FROM orders";

        Timestamp startTs = Timestamp.from(start.toInstant());
        Timestamp endTs = Timestamp.from(end.toInstant());

        jdbcTemplate.query(orderSummarySql, rs -> {
            resp.setPaidOrdersCount(rs.getLong("paid_cnt"));
            resp.setPaidRevenue(rs.getBigDecimal("paid_rev"));
            resp.setPreparingOrdersCount(rs.getLong("prep_cnt"));
            resp.setCompletedOrdersCount(rs.getLong("comp_cnt"));
        }, startTs, endTs, startTs, endTs);

        // 2. Giá vốn, Lợi nhuận gộp & Lợi nhuận ước tính (Dùng chung logic của ProfitReportService)
        ProfitReportResponse profitData = profitReportService.getProfitReport(startDate, endDate);
        resp.setMaterialCost(profitData.getMaterialCost());
        resp.setGrossProfit(profitData.getGrossProfit());
        resp.setGrossProfitMargin(BigDecimal.valueOf(profitData.getGrossMargin()));
        resp.setInternalPayrollCost(profitData.getInternalPayrollCost());
        resp.setOtherOperatingExpenses(profitData.getOperatingExpenses());
        resp.setEstimatedProfit(profitData.getEstimatedProfit());
        resp.setEstimatedProfitMargin(BigDecimal.valueOf(profitData.getEstimatedProfitMargin()));

        // 3. Kho & Định giá tồn kho
        String stockSql = "SELECT COUNT(*) AS total_cnt, " +
                          "       COALESCE(SUM(current_stock * avg_unit_cost), 0) AS total_val, " +
                          "       COUNT(CASE WHEN current_stock <= min_stock_threshold THEN 1 END) AS low_stock_cnt " +
                          "FROM ingredients WHERE active = true";
        jdbcTemplate.query(stockSql, rs -> {
            resp.setEstimatedInventoryValuation(rs.getBigDecimal("total_val"));
            resp.setLowStockIngredientsCount(rs.getLong("low_stock_cnt"));
        });

        // 4. Số nhân viên đang hoạt động
        Long activeEmp = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE'", Long.class);
        resp.setActiveEmployeesCount(activeEmp != null ? activeEmp : 0L);

        // 5. Tính tỷ lệ tăng trưởng so với kỳ trước tương ứng
        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        LocalDate prevStartDate = startDate.minusDays(days);
        LocalDate prevEndDate = startDate.minusDays(1);
        OffsetDateTime prevStart = prevStartDate.atStartOfDay(VN_ZONE).toOffsetDateTime();
        OffsetDateTime prevEnd = prevEndDate.plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();

        String prevOrderSql = "SELECT COUNT(*) AS prev_cnt, COALESCE(SUM(total_amount), 0) AS prev_rev " +
                              "FROM orders WHERE payment_status = 'PAID' AND paid_at >= ? AND paid_at < ?";
        jdbcTemplate.query(prevOrderSql, rs -> {
            long prevOrders = rs.getLong("prev_cnt");
            BigDecimal prevRev = rs.getBigDecimal("prev_rev");
            if (prevRev.compareTo(BigDecimal.ZERO) > 0) {
                double growth = resp.getPaidRevenue().subtract(prevRev)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(prevRev, 1, RoundingMode.HALF_UP).doubleValue();
                resp.setRevenueGrowthPercent(growth);
            } else {
                resp.setRevenueGrowthPercent(null); // Không có cơ sở so sánh (kỳ trước = 0)
            }

            if (prevOrders > 0) {
                double oGrowth = ((double) (resp.getPaidOrdersCount() - prevOrders) / prevOrders) * 100.0;
                resp.setOrderGrowthPercent(Math.round(oGrowth * 10.0) / 10.0);
            } else {
                resp.setOrderGrowthPercent(null);
            }
        }, Timestamp.from(prevStart.toInstant()), Timestamp.from(prevEnd.toInstant()));

        return resp;
    }

    public List<OrderStatusStatDto> getOrderStatusDistribution(LocalDate startDate, LocalDate endDate) {
        OffsetDateTime start = startDate.atStartOfDay(VN_ZONE).toOffsetDateTime();
        OffsetDateTime end = endDate.plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();

        String sql = "SELECT order_status, COUNT(*) AS cnt " +
                     "FROM orders " +
                     "WHERE created_at >= ? AND created_at < ? " +
                     "GROUP BY order_status";

        Map<String, Long> countMap = new HashMap<>();
        long total = 0;
        List<Object[]> rows = jdbcTemplate.query(sql, (rs, i) ->
                new Object[]{rs.getString("order_status"), rs.getLong("cnt")},
                Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));

        for (Object[] r : rows) {
            String status = (String) r[0];
            Long cnt = (Long) r[1];
            countMap.put(status, cnt);
            total += cnt;
        }

        List<OrderStatusStatDto> result = new ArrayList<>();
        Map<String, String[]> statusMeta = Map.of(
                "PENDING_PAYMENT", new String[]{"Chờ thanh toán", "#f59e0b"},
                "PAID", new String[]{"Đã thanh toán", "#10b981"},
                "CONFIRMED", new String[]{"Đã xác nhận", "#3b82f6"},
                "PROCESSING", new String[]{"Đang chuẩn bị", "#8b5cf6"},
                "COMPLETED", new String[]{"Hoàn thành", "#059669"},
                "CANCELLED", new String[]{"Đã hủy", "#ef4444"},
                "EXPIRED", new String[]{"Hết hạn", "#6b7280"}
        );

        for (Map.Entry<String, String[]> entry : statusMeta.entrySet()) {
            String code = entry.getKey();
            String name = entry.getValue()[0];
            String color = entry.getValue()[1];
            long count = countMap.getOrDefault(code, 0L);
            double pct = total > 0 ? Math.round(((double) count / total) * 1000.0) / 10.0 : 0.0;
            result.add(new OrderStatusStatDto(code, name, count, pct, color));
        }

        return result;
    }

    public List<CostBreakdownDto> getCostBreakdown(LocalDate startDate, LocalDate endDate) {
        ProfitReportResponse profitData = profitReportService.getProfitReport(startDate, endDate);
        BigDecimal material = profitData.getMaterialCost();
        BigDecimal payroll = profitData.getInternalPayrollCost();
        BigDecimal opExpense = profitData.getOperatingExpenses();
        BigDecimal total = material.add(payroll).add(opExpense);

        List<CostBreakdownDto> list = new ArrayList<>();
        if (total.compareTo(BigDecimal.ZERO) == 0) {
            list.add(new CostBreakdownDto("MATERIAL", "Giá vốn nguyên liệu", BigDecimal.ZERO, 0.0, "#f59e0b"));
            list.add(new CostBreakdownDto("PAYROLL", "Chi phí lương nội bộ", BigDecimal.ZERO, 0.0, "#3b82f6"));
            list.add(new CostBreakdownDto("OPERATING", "Chi phí vận hành khác", BigDecimal.ZERO, 0.0, "#ec4899"));
            return list;
        }

        double matPct = material.multiply(BigDecimal.valueOf(100)).divide(total, 1, RoundingMode.HALF_UP).doubleValue();
        double payPct = payroll.multiply(BigDecimal.valueOf(100)).divide(total, 1, RoundingMode.HALF_UP).doubleValue();
        double expPct = opExpense.multiply(BigDecimal.valueOf(100)).divide(total, 1, RoundingMode.HALF_UP).doubleValue();

        list.add(new CostBreakdownDto("MATERIAL", "Giá vốn nguyên liệu tiêu hao", material, matPct, "#f59e0b"));
        list.add(new CostBreakdownDto("PAYROLL", "Chi phí lương nhân viên đã chốt", payroll, payPct, "#3b82f6"));
        list.add(new CostBreakdownDto("OPERATING", "Chi phí vận hành khác", opExpense, expPct, "#ec4899"));
        return list;
    }

    public List<DashboardAlertDto> getAlerts() {
        List<DashboardAlertDto> alerts = new ArrayList<>();

        // 1. Cảnh báo kho nguyên liệu sắp hết
        String lowStockSql = "SELECT name, current_stock, min_stock_threshold, unit FROM ingredients " +
                             "WHERE active = true AND current_stock <= min_stock_threshold " +
                             "ORDER BY (current_stock / NULLIF(min_stock_threshold, 0)) ASC LIMIT 5";
        jdbcTemplate.query(lowStockSql, rs -> {
            String name = rs.getString("name");
            BigDecimal curr = rs.getBigDecimal("current_stock");
            BigDecimal thresh = rs.getBigDecimal("min_stock_threshold");
            String unit = rs.getString("unit");
            alerts.add(new DashboardAlertDto("WARNING", "INVENTORY",
                    "Nguyên liệu dưới ngưỡng an toàn",
                    String.format("%s còn %s %s (ngưỡng tối thiểu: %s %s)", name, curr.stripTrailingZeros().toPlainString(), unit, thresh.stripTrailingZeros().toPlainString(), unit),
                    "/admin/inventory"));
        });

        // 2. Cảnh báo đơn đặt tiệc cần chuẩn bị (CONFIRMED / PROCESSING)
        Long prepCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM orders WHERE order_status IN ('CONFIRMED', 'PROCESSING')", Long.class);
        if (prepCount != null && prepCount > 0) {
            alerts.add(new DashboardAlertDto("INFO", "ORDER",
                    "Đơn tiệc đang cần vận hành",
                    String.format("Có %d đơn tiệc đã thanh toán đang trong quá trình chuẩn bị hoặc thực hiện.", prepCount),
                    "/admin/orders"));
        }

        // 3. Cảnh báo công nợ nhà cung cấp chưa thanh toán
        BigDecimal supplierDebt = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(total_amount - amount_paid), 0) FROM stock_receipts WHERE status = 'CONFIRMED' AND payment_status != 'PAID'",
                BigDecimal.class);
        if (supplierDebt != null && supplierDebt.compareTo(BigDecimal.ZERO) > 0) {
            alerts.add(new DashboardAlertDto("WARNING", "SUPPLIER",
                    "Công nợ nhà cung cấp cần đối soát",
                    String.format("Tổng nợ nguyên liệu nhập chưa thanh toán: %s đ.", new java.text.DecimalFormat("#,###").format(supplierDebt)),
                    "/admin/stock-receipts"));
        }

        // 4. Cảnh báo lương nhân viên đã chốt nhưng chưa chi trả
        BigDecimal unpaidPayroll = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(p.net_salary), 0) FROM payrolls p JOIN payroll_periods pp ON pp.id = p.payroll_period_id WHERE pp.status IN ('FINALIZED', 'CLOSED') AND p.payment_status = 'UNPAID'",
                BigDecimal.class);
        if (unpaidPayroll != null && unpaidPayroll.compareTo(BigDecimal.ZERO) > 0) {
            alerts.add(new DashboardAlertDto("WARNING", "PAYROLL",
                    "Bảng lương đã chốt chưa giải ngân",
                    String.format("Còn %s đ tiền lương nhân viên đã chốt sổ đang chờ giải ngân thanh toán.", new java.text.DecimalFormat("#,###").format(unpaidPayroll)),
                    "/admin/payrolls"));
        }

        return alerts;
    }
}
