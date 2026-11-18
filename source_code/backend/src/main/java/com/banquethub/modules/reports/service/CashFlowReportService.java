package com.banquethub.modules.reports.service;

import com.banquethub.modules.reports.dto.CashFlowReportResponse;
import com.banquethub.modules.reports.dto.TimeSeriesPoint;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class CashFlowReportService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private final JdbcTemplate jdbcTemplate;

    public CashFlowReportService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public CashFlowReportResponse getCashFlowReport(LocalDate startDate, LocalDate endDate) {
        OffsetDateTime start = startDate.atStartOfDay(VN_ZONE).toOffsetDateTime();
        OffsetDateTime end = endDate.plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();

        CashFlowReportResponse resp = new CashFlowReportResponse();

        // 1. Dòng tiền thu mô phỏng (từ PaymentTransaction thành công)
        String inflowSql = "SELECT COALESCE(SUM(amount), 0) FROM payment_transactions " +
                           "WHERE status = 'SUCCESS' AND paid_at >= ? AND paid_at < ?";
        BigDecimal inflow = jdbcTemplate.queryForObject(inflowSql, BigDecimal.class,
                Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));
        if (inflow == null) inflow = BigDecimal.ZERO;
        resp.setSimulatedInflow(inflow);

        // 2. Chi trả nhà cung cấp đã ghi nhận
        String supplierPaidSql = "SELECT COALESCE(SUM(amount), 0) FROM (" +
                                 "    SELECT amount FROM supplier_payments WHERE payment_date >= ? AND payment_date <= ? " +
                                 "    UNION ALL " +
                                 "    SELECT amount_paid AS amount FROM stock_receipts sr " +
                                 "    WHERE sr.payment_status = 'PAID' AND sr.last_paid_at >= ? AND sr.last_paid_at < ? " +
                                 "      AND NOT EXISTS (SELECT 1 FROM supplier_payments sp WHERE sp.stock_receipt_id = sr.id)" +
                                 ") sub";
        BigDecimal paidSuppliers = jdbcTemplate.queryForObject(supplierPaidSql, BigDecimal.class,
                Date.valueOf(startDate), Date.valueOf(endDate),
                Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));
        if (paidSuppliers == null) paidSuppliers = BigDecimal.ZERO;
        resp.setPaidToSuppliers(paidSuppliers);

        // 3. Chi lương đã ghi nhận
        String salaryPaidSql = "SELECT COALESCE(SUM(amount), 0) FROM salary_payments " +
                               "WHERE payment_date >= ? AND payment_date <= ?";
        BigDecimal paidSalaries = jdbcTemplate.queryForObject(salaryPaidSql, BigDecimal.class,
                Date.valueOf(startDate), Date.valueOf(endDate));
        if (paidSalaries == null) paidSalaries = BigDecimal.ZERO;
        resp.setPaidSalaries(paidSalaries);

        // 4. Chi phí vận hành khác đã thanh toán
        String opExpensePaidSql = "SELECT COALESCE(SUM(amount), 0) FROM operating_expenses " +
                                  "WHERE payment_status = 'PAID' AND paid_at >= ? AND paid_at < ?";
        BigDecimal paidExpenses = jdbcTemplate.queryForObject(opExpensePaidSql, BigDecimal.class,
                Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));
        if (paidExpenses == null) paidExpenses = BigDecimal.ZERO;
        resp.setPaidOperatingExpenses(paidExpenses);

        // Tổng dòng tiền chi ghi nhận = NCC + Lương + Vận hành
        BigDecimal recordedOutflow = paidSuppliers.add(paidSalaries).add(paidExpenses);
        resp.setRecordedOutflow(recordedOutflow);

        // Dòng tiền thuần mô phỏng = Thu - Chi
        BigDecimal netCashFlow = inflow.subtract(recordedOutflow);
        resp.setNetCashFlow(netCashFlow);

        // 5. Các khoản công nợ / chưa thanh toán
        // Công nợ NCC
        BigDecimal supplierDebt = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(total_amount - amount_paid), 0) FROM stock_receipts WHERE status = 'CONFIRMED' AND payment_status != 'PAID'",
                BigDecimal.class);
        resp.setOutstandingSupplierDebt(supplierDebt != null ? supplierDebt : BigDecimal.ZERO);

        // Lương chưa thanh toán của các kỳ đã chốt
        BigDecimal unpaidSalary = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(p.net_salary), 0) FROM payrolls p JOIN payroll_periods pp ON pp.id = p.payroll_period_id WHERE pp.status IN ('FINALIZED', 'CLOSED') AND p.payment_status = 'UNPAID'",
                BigDecimal.class);
        resp.setUnpaidSalaries(unpaidSalary != null ? unpaidSalary : BigDecimal.ZERO);

        // Chi phí vận hành chưa trả
        BigDecimal unpaidExpenses = jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(amount), 0) FROM operating_expenses WHERE payment_status = 'UNPAID'",
                BigDecimal.class);
        resp.setUnpaidOperatingExpenses(unpaidExpenses != null ? unpaidExpenses : BigDecimal.ZERO);

        resp.setTotalUnpaidObligations(resp.getOutstandingSupplierDebt()
                .add(resp.getUnpaidSalaries())
                .add(resp.getUnpaidOperatingExpenses()));

        // 6. Biểu đồ dòng tiền theo ngày
        resp.setDailyCashFlow(calculateDailyCashFlow(startDate, endDate));

        return resp;
    }

    private List<TimeSeriesPoint> calculateDailyCashFlow(LocalDate startDate, LocalDate endDate) {
        OffsetDateTime start = startDate.atStartOfDay(VN_ZONE).toOffsetDateTime();
        OffsetDateTime end = endDate.plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();

        // Thu theo ngày
        String inSql = "SELECT DATE(paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') AS d, COALESCE(SUM(amount), 0) AS amt " +
                       "FROM payment_transactions " +
                       "WHERE status = 'SUCCESS' AND paid_at >= ? AND paid_at < ? " +
                       "GROUP BY DATE(paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')";
        Map<LocalDate, BigDecimal> inflowsByDate = new HashMap<>();
        jdbcTemplate.query(inSql, rs -> {
            inflowsByDate.put(rs.getDate("d").toLocalDate(), rs.getBigDecimal("amt"));
        }, Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));

        // Chi theo ngày (NCC + Lương + Vận hành)
        Map<LocalDate, BigDecimal> outflowsByDate = new HashMap<>();
        // NCC
        jdbcTemplate.query("SELECT payment_date, SUM(amount) AS amt FROM supplier_payments WHERE payment_date >= ? AND payment_date <= ? GROUP BY payment_date",
                rs -> { outflowsByDate.merge(rs.getDate("payment_date").toLocalDate(), rs.getBigDecimal("amt"), BigDecimal::add); },
                Date.valueOf(startDate), Date.valueOf(endDate));
        // Lương
        jdbcTemplate.query("SELECT payment_date, SUM(amount) AS amt FROM salary_payments WHERE payment_date >= ? AND payment_date <= ? GROUP BY payment_date",
                rs -> { outflowsByDate.merge(rs.getDate("payment_date").toLocalDate(), rs.getBigDecimal("amt"), BigDecimal::add); },
                Date.valueOf(startDate), Date.valueOf(endDate));
        // Chi phí khác
        jdbcTemplate.query("SELECT DATE(paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') AS d, SUM(amount) AS amt FROM operating_expenses WHERE payment_status = 'PAID' AND paid_at >= ? AND paid_at < ? GROUP BY DATE(paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh')",
                rs -> { outflowsByDate.merge(rs.getDate("d").toLocalDate(), rs.getBigDecimal("amt"), BigDecimal::add); },
                Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));

        List<TimeSeriesPoint> list = new ArrayList<>();
        LocalDate curr = startDate;
        while (!curr.isAfter(endDate)) {
            BigDecimal inVal = inflowsByDate.getOrDefault(curr, BigDecimal.ZERO);
            BigDecimal outVal = outflowsByDate.getOrDefault(curr, BigDecimal.ZERO);
            BigDecimal net = inVal.subtract(outVal);

            String label = curr.format(DateTimeFormatter.ofPattern("dd/MM"));
            // value = Thu, secondaryValue = Chi, thirdValue = Thuần
            list.add(new TimeSeriesPoint(label, curr.toString(), inVal, outVal, net));
            curr = curr.plusDays(1);
        }
        return list;
    }
}
