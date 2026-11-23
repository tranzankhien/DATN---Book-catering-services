package com.banquethub.modules.reports.service;

import com.banquethub.modules.reports.dto.MonthlyProfitBreakdownDto;
import com.banquethub.modules.reports.dto.ProfitReportResponse;
import com.banquethub.modules.reports.dto.TimeSeriesPoint;
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
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ProfitReportService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private final JdbcTemplate jdbcTemplate;

    public ProfitReportService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public ProfitReportResponse getProfitReport(LocalDate startDate, LocalDate endDate) {
        OffsetDateTime start = startDate.atStartOfDay(VN_ZONE).toOffsetDateTime();
        OffsetDateTime end = endDate.plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();

        ProfitReportResponse resp = new ProfitReportResponse();

        // A: Doanh thu từ đơn đã thanh toán theo paid_at
        String revSql = "SELECT COALESCE(SUM(total_amount), 0) FROM orders " +
                        "WHERE payment_status = 'PAID' AND paid_at >= ? AND paid_at < ?";
        BigDecimal revenue = jdbcTemplate.queryForObject(revSql, BigDecimal.class,
                Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));
        if (revenue == null) revenue = BigDecimal.ZERO;
        resp.setPaidRevenue(revenue);

        // B: Giá vốn nguyên liệu tiêu hao của các đơn trong kỳ
        String cogsSql = "SELECT COALESCE(SUM(oic.total_cost), 0) " +
                         "FROM order_ingredient_consumptions oic " +
                         "JOIN orders o ON o.id = oic.order_id " +
                         "WHERE o.payment_status = 'PAID' AND o.paid_at >= ? AND o.paid_at < ?";
        BigDecimal materialCost = jdbcTemplate.queryForObject(cogsSql, BigDecimal.class,
                Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));
        if (materialCost == null) materialCost = BigDecimal.ZERO;
        resp.setMaterialCost(materialCost);

        // Lợi nhuận gộp = A - B
        BigDecimal grossProfit = revenue.subtract(materialCost);
        resp.setGrossProfit(grossProfit);
        if (revenue.compareTo(BigDecimal.ZERO) > 0) {
            double margin = grossProfit.multiply(BigDecimal.valueOf(100))
                    .divide(revenue, 2, RoundingMode.HALF_UP).doubleValue();
            resp.setGrossMargin(margin);
        } else {
            resp.setGrossMargin(0.0);
        }

        // C: Chi phí lương nội bộ đã chốt trong kỳ
        int startYear = startDate.getYear();
        int startMonth = startDate.getMonthValue();
        int endYear = endDate.getYear();
        int endMonth = endDate.getMonthValue();

        String payrollSql = "SELECT COALESCE(SUM(p.net_salary), 0) " +
                            "FROM payroll_periods pp " +
                            "JOIN payrolls p ON p.payroll_period_id = pp.id " +
                            "WHERE pp.status IN ('FINALIZED', 'CLOSED') " +
                            "  AND (pp.year * 100 + pp.month) >= (? * 100 + ?) " +
                            "  AND (pp.year * 100 + pp.month) <= (? * 100 + ?)";
        BigDecimal payrollCost = jdbcTemplate.queryForObject(payrollSql, BigDecimal.class,
                startYear, startMonth, endYear, endMonth);
        if (payrollCost == null) payrollCost = BigDecimal.ZERO;
        resp.setInternalPayrollCost(payrollCost);

        // D: Chi phí vận hành khác phát sinh trong kỳ
        String expenseSql = "SELECT COALESCE(SUM(amount), 0) FROM operating_expenses " +
                            "WHERE incurred_date >= ? AND incurred_date <= ?";
        BigDecimal opExpenses = jdbcTemplate.queryForObject(expenseSql, BigDecimal.class,
                Date.valueOf(startDate), Date.valueOf(endDate));
        if (opExpenses == null) opExpenses = BigDecimal.ZERO;
        resp.setOperatingExpenses(opExpenses);

        // Tổng chi phí tương ứng = B + C + D (không cộng tiền nhập hàng vào đây)
        BigDecimal totalExpenses = materialCost.add(payrollCost).add(opExpenses);
        resp.setTotalExpenses(totalExpenses);

        // Lợi nhuận ước tính = A - B - C - D (cho phép âm)
        BigDecimal estimatedProfit = revenue.subtract(totalExpenses);
        resp.setEstimatedProfit(estimatedProfit);

        if (revenue.compareTo(BigDecimal.ZERO) > 0) {
            double estMargin = estimatedProfit.multiply(BigDecimal.valueOf(100))
                    .divide(revenue, 2, RoundingMode.HALF_UP).doubleValue();
            resp.setEstimatedProfitMargin(estMargin);
        } else {
            resp.setEstimatedProfitMargin(0.0);
        }

        // Bảng đối soát từng tháng trong khoảng thời gian
        resp.setMonthlyBreakdown(calculateMonthlyBreakdown(startDate, endDate));

        return resp;
    }

    public List<TimeSeriesPoint> getProfitTrend(int months) {
        LocalDate now = LocalDate.now(VN_ZONE);
        List<TimeSeriesPoint> trend = new ArrayList<>();

        for (int i = months - 1; i >= 0; i--) {
            LocalDate targetMonth = now.minusMonths(i);
            LocalDate mStart = targetMonth.withDayOfMonth(1);
            LocalDate mEnd = targetMonth.withDayOfMonth(targetMonth.lengthOfMonth());

            ProfitReportResponse report = getProfitReport(mStart, mEnd);
            String label = targetMonth.format(DateTimeFormatter.ofPattern("MM/yyyy"));
            String dateStr = mStart.toString();

            // value: Lợi nhuận ước tính (khớp với Tooltip và Bar chart dataKey="value")
            // secondaryValue: Doanh thu thực thu, thirdValue: Tổng chi phí tương ứng
            trend.add(new TimeSeriesPoint(label, dateStr, report.getEstimatedProfit(), report.getPaidRevenue(), report.getTotalExpenses()));
        }

        return trend;
    }

    public List<TimeSeriesPoint> getProfitTrend(LocalDate startDate, LocalDate endDate) {
        List<TimeSeriesPoint> trend = new ArrayList<>();
        LocalDate curr = startDate.withDayOfMonth(1);
        LocalDate last = endDate.withDayOfMonth(1);

        while (!curr.isAfter(last)) {
            LocalDate mStart = curr;
            LocalDate mEnd = curr.withDayOfMonth(curr.lengthOfMonth());

            ProfitReportResponse report = getProfitReport(mStart, mEnd);
            String label = curr.format(DateTimeFormatter.ofPattern("MM/yyyy"));
            String dateStr = mStart.toString();

            trend.add(new TimeSeriesPoint(label, dateStr, report.getEstimatedProfit(), report.getPaidRevenue(), report.getTotalExpenses()));
            curr = curr.plusMonths(1);
        }

        return trend;
    }

    private List<MonthlyProfitBreakdownDto> calculateMonthlyBreakdown(LocalDate startDate, LocalDate endDate) {
        List<MonthlyProfitBreakdownDto> list = new ArrayList<>();
        LocalDate curr = startDate.withDayOfMonth(1);
        LocalDate last = endDate.withDayOfMonth(1);

        while (!curr.isAfter(last)) {
            int y = curr.getYear();
            int m = curr.getMonthValue();
            LocalDate monthStart = curr;
            LocalDate monthEnd = curr.withDayOfMonth(curr.lengthOfMonth());

            OffsetDateTime startTs = monthStart.atStartOfDay(VN_ZONE).toOffsetDateTime();
            OffsetDateTime endTs = monthEnd.plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();

            // Doanh thu
            BigDecimal rev = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'PAID' AND paid_at >= ? AND paid_at < ?",
                    BigDecimal.class, Timestamp.from(startTs.toInstant()), Timestamp.from(endTs.toInstant()));

            // Giá vốn
            BigDecimal mat = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(oic.total_cost), 0) FROM order_ingredient_consumptions oic JOIN orders o ON o.id = oic.order_id WHERE o.payment_status = 'PAID' AND o.paid_at >= ? AND o.paid_at < ?",
                    BigDecimal.class, Timestamp.from(startTs.toInstant()), Timestamp.from(endTs.toInstant()));

            // Lương đã chốt tháng này
            BigDecimal pay = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(p.net_salary), 0) FROM payroll_periods pp JOIN payrolls p ON p.payroll_period_id = pp.id WHERE pp.status IN ('FINALIZED', 'CLOSED') AND pp.year = ? AND pp.month = ?",
                    BigDecimal.class, y, m);

            // Chi phí vận hành tháng này
            BigDecimal exp = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(amount), 0) FROM operating_expenses WHERE incurred_date >= ? AND incurred_date <= ?",
                    BigDecimal.class, Date.valueOf(monthStart), Date.valueOf(monthEnd));

            rev = rev != null ? rev : BigDecimal.ZERO;
            mat = mat != null ? mat : BigDecimal.ZERO;
            pay = pay != null ? pay : BigDecimal.ZERO;
            exp = exp != null ? exp : BigDecimal.ZERO;

            MonthlyProfitBreakdownDto dto = new MonthlyProfitBreakdownDto(String.format("Tháng %02d/%d", m, y), y, m);
            dto.setRevenue(rev);
            dto.setMaterialCost(mat);
            dto.setGrossProfit(rev.subtract(mat));
            dto.setPayrollCost(pay);
            dto.setOperatingExpense(exp);
            dto.setEstimatedProfit(rev.subtract(mat).subtract(pay).subtract(exp));

            list.add(dto);
            curr = curr.plusMonths(1);
        }

        return list;
    }
}
