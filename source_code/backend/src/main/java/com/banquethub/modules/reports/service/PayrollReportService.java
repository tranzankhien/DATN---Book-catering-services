package com.banquethub.modules.reports.service;

import com.banquethub.modules.reports.dto.PayrollReportResponse;
import com.banquethub.modules.reports.dto.TimeSeriesPoint;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class PayrollReportService {

    private final JdbcTemplate jdbcTemplate;

    public PayrollReportService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public PayrollReportResponse getPayrollOverview(LocalDate startDate, LocalDate endDate) {
        PayrollReportResponse resp = new PayrollReportResponse();

        // 1. Số nhân viên đang hoạt động
        Long activeEmp = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM employees WHERE status = 'ACTIVE'", Long.class);
        resp.setActiveEmployeesCount(activeEmp != null ? activeEmp : 0L);

        int startYear = startDate.getYear();
        int startMonth = startDate.getMonthValue();
        int endYear = endDate.getYear();
        int endMonth = endDate.getMonthValue();

        // 2. Thống kê kỳ lương và lương đã chốt trong khoảng (năm, tháng)
        String periodSql = "SELECT COUNT(DISTINCT pp.id) AS period_cnt, " +
                           "       COALESCE(SUM(p.net_salary), 0) AS total_net, " +
                           "       COALESCE(SUM(p.total_allowances), 0) AS total_allowance, " +
                           "       COALESCE(SUM(p.total_deductions), 0) AS total_deduction " +
                           "FROM payroll_periods pp " +
                           "JOIN payrolls p ON p.payroll_period_id = pp.id " +
                           "WHERE pp.status IN ('FINALIZED', 'CLOSED') " +
                           "  AND (pp.year * 100 + pp.month) >= (? * 100 + ?) " +
                           "  AND (pp.year * 100 + pp.month) <= (? * 100 + ?)";

        jdbcTemplate.query(periodSql, (rs) -> {
            resp.setFinalizedPeriodsCount(rs.getLong("period_cnt"));
            resp.setTotalFinalizedNetSalary(rs.getBigDecimal("total_net"));
            resp.setTotalAllowances(rs.getBigDecimal("total_allowance"));
            resp.setTotalDeductions(rs.getBigDecimal("total_deduction"));
        }, startYear, startMonth, endYear, endMonth);

        // 3. Tiền lương đã thực tế chi trả trong khoảng thời gian (dựa theo SalaryPayment.payment_date)
        String paidSql = "SELECT COALESCE(SUM(amount), 0) FROM salary_payments " +
                         "WHERE payment_date >= ? AND payment_date <= ?";
        BigDecimal paid = jdbcTemplate.queryForObject(paidSql, BigDecimal.class,
                Date.valueOf(startDate), Date.valueOf(endDate));
        resp.setTotalPaidSalary(paid != null ? paid : BigDecimal.ZERO);

        // 4. Lương chưa thanh toán (công nợ lương của các kỳ đã chốt)
        String unpaidSql = "SELECT COALESCE(SUM(p.net_salary), 0) " +
                           "FROM payrolls p " +
                           "JOIN payroll_periods pp ON pp.id = p.payroll_period_id " +
                           "WHERE pp.status IN ('FINALIZED', 'CLOSED') AND p.payment_status = 'UNPAID'";
        BigDecimal unpaid = jdbcTemplate.queryForObject(unpaidSql, BigDecimal.class);
        resp.setTotalUnpaidSalary(unpaid != null ? unpaid : BigDecimal.ZERO);

        return resp;
    }

    public List<TimeSeriesPoint> getPayrollTrend(int months) {
        String sql = "SELECT pp.year, pp.month, " +
                     "       COALESCE(SUM(p.net_salary), 0) AS total_net, " +
                     "       COUNT(p.id) AS emp_count " +
                     "FROM payroll_periods pp " +
                     "JOIN payrolls p ON p.payroll_period_id = pp.id " +
                     "WHERE pp.status IN ('FINALIZED', 'CLOSED') " +
                     "GROUP BY pp.year, pp.month " +
                     "ORDER BY pp.year DESC, pp.month DESC " +
                     "LIMIT ?";

        List<TimeSeriesPoint> list = jdbcTemplate.query(sql, (rs, rowNum) -> {
            int y = rs.getInt("year");
            int m = rs.getInt("month");
            BigDecimal net = rs.getBigDecimal("total_net");
            long cnt = rs.getLong("emp_count");
            String label = String.format("T%02d/%d", m, y);
            String dateStr = String.format("%04d-%02d-01", y, m);
            return new TimeSeriesPoint(label, dateStr, net, cnt);
        }, months);

        // Đảo ngược lại theo thứ tự thời gian tăng dần
        List<TimeSeriesPoint> sorted = new ArrayList<>(list);
        java.util.Collections.reverse(sorted);
        return sorted;
    }
}
