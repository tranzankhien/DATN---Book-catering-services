package com.banquethub.modules.reports.service;

import com.banquethub.modules.reports.dto.PaidOrderReportDto;
import com.banquethub.modules.reports.dto.RevenueSummaryResponse;
import com.banquethub.modules.reports.dto.TimeSeriesPoint;
import com.banquethub.modules.reports.dto.TopDishReportDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class RevenueReportService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private final JdbcTemplate jdbcTemplate;

    public RevenueReportService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public RevenueSummaryResponse getRevenueSummary(LocalDate startDate, LocalDate endDate) {
        OffsetDateTime start = startDate.atStartOfDay(VN_ZONE).toOffsetDateTime();
        OffsetDateTime end = endDate.plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();

        String sql = "SELECT COALESCE(SUM(total_amount), 0) AS total_rev, " +
                     "       COUNT(id) AS order_cnt, " +
                     "       COALESCE(SUM(table_count), 0) AS table_cnt " +
                     "FROM orders " +
                     "WHERE payment_status = 'PAID' AND paid_at >= ? AND paid_at < ?";

        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
            BigDecimal totalRev = rs.getBigDecimal("total_rev");
            long orderCount = rs.getLong("order_cnt");
            long tableCount = rs.getLong("table_cnt");
            BigDecimal aov = orderCount > 0
                    ? totalRev.divide(BigDecimal.valueOf(orderCount), 0, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return new RevenueSummaryResponse(totalRev, orderCount, aov, tableCount);
        }, Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));
    }

    public List<TimeSeriesPoint> getRevenueTrend(LocalDate startDate, LocalDate endDate) {
        OffsetDateTime start = startDate.atStartOfDay(VN_ZONE).toOffsetDateTime();
        OffsetDateTime end = endDate.plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();

        String sql = "SELECT DATE(paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') AS d, " +
                     "       COALESCE(SUM(total_amount), 0) AS rev, " +
                     "       COUNT(id) AS cnt " +
                     "FROM orders " +
                     "WHERE payment_status = 'PAID' AND paid_at >= ? AND paid_at < ? " +
                     "GROUP BY DATE(paid_at AT TIME ZONE 'Asia/Ho_Chi_Minh') " +
                     "ORDER BY d ASC";

        Map<LocalDate, TimeSeriesPoint> pointsMap = new HashMap<>();
        jdbcTemplate.query(sql, (rs) -> {
            LocalDate d = rs.getDate("d").toLocalDate();
            BigDecimal rev = rs.getBigDecimal("rev");
            long cnt = rs.getLong("cnt");
            pointsMap.put(d, new TimeSeriesPoint(d.format(DateTimeFormatter.ofPattern("dd/MM")), d.toString(), rev, cnt));
        }, Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));

        List<TimeSeriesPoint> result = new ArrayList<>();
        LocalDate curr = startDate;
        while (!curr.isAfter(endDate)) {
            TimeSeriesPoint point = pointsMap.getOrDefault(curr,
                    new TimeSeriesPoint(curr.format(DateTimeFormatter.ofPattern("dd/MM")), curr.toString(), BigDecimal.ZERO, 0L));
            result.add(point);
            curr = curr.plusDays(1);
        }
        return result;
    }

    public List<TopDishReportDto> getTopDishes(LocalDate startDate, LocalDate endDate, int limit) {
        OffsetDateTime start = startDate.atStartOfDay(VN_ZONE).toOffsetDateTime();
        OffsetDateTime end = endDate.plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();

        String totalSql = "SELECT COALESCE(SUM(oi.quantity_per_table * o.table_count * oi.unit_price_snapshot), 0) " +
                          "FROM order_items oi JOIN orders o ON o.id = oi.order_id " +
                          "WHERE o.payment_status = 'PAID' AND o.paid_at >= ? AND o.paid_at < ?";
        BigDecimal grandTotalDishRevenue = jdbcTemplate.queryForObject(totalSql, BigDecimal.class,
                Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));
        if (grandTotalDishRevenue == null) grandTotalDishRevenue = BigDecimal.ZERO;

        String sql = "SELECT oi.dish_id, " +
                     "       oi.dish_name_snapshot, " +
                     "       COALESCE(dc.name, 'Món khác') AS cat_name, " +
                     "       SUM(oi.quantity_per_table * o.table_count) AS total_portions, " +
                     "       SUM(oi.quantity_per_table * o.table_count * oi.unit_price_snapshot) AS total_revenue " +
                     "FROM order_items oi " +
                     "JOIN orders o ON o.id = oi.order_id " +
                     "LEFT JOIN dishes d ON d.id = oi.dish_id " +
                     "LEFT JOIN dish_categories dc ON dc.id = d.category_id " +
                     "WHERE o.payment_status = 'PAID' AND o.paid_at >= ? AND o.paid_at < ? " +
                     "GROUP BY oi.dish_id, oi.dish_name_snapshot, dc.name " +
                     "ORDER BY total_revenue DESC " +
                     "LIMIT ?";

        final BigDecimal totalRef = grandTotalDishRevenue;
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Long dishId = rs.getLong("dish_id");
            String dishName = rs.getString("dish_name_snapshot");
            String catName = rs.getString("cat_name");
            long portions = rs.getLong("total_portions");
            BigDecimal rev = rs.getBigDecimal("total_revenue");
            double share = totalRef.compareTo(BigDecimal.ZERO) > 0
                    ? rev.multiply(BigDecimal.valueOf(100)).divide(totalRef, 2, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;
            return new TopDishReportDto(dishId, dishName, catName, portions, rev, share);
        }, Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()), limit);
    }

    public Page<PaidOrderReportDto> getPaidOrders(LocalDate startDate, LocalDate endDate, Pageable pageable) {
        OffsetDateTime start = startDate.atStartOfDay(VN_ZONE).toOffsetDateTime();
        OffsetDateTime end = endDate.plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();

        String countSql = "SELECT COUNT(*) FROM orders WHERE payment_status = 'PAID' AND paid_at >= ? AND paid_at < ?";
        Long totalElements = jdbcTemplate.queryForObject(countSql, Long.class,
                Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));
        if (totalElements == null || totalElements == 0) {
            return new PageImpl<>(Collections.emptyList(), pageable, 0);
        }

        String dataSql = "SELECT o.id, o.order_code, o.customer_name, o.customer_phone, o.table_count, " +
                         "       o.paid_at, o.event_date_time, o.total_amount, " +
                         "       COALESCE(cogs.total_cogs, 0) AS total_cogs " +
                         "FROM orders o " +
                         "LEFT JOIN (" +
                         "    SELECT order_id, SUM(total_cost) AS total_cogs " +
                         "    FROM order_ingredient_consumptions " +
                         "    GROUP BY order_id" +
                         ") cogs ON cogs.order_id = o.id " +
                         "WHERE o.payment_status = 'PAID' AND o.paid_at >= ? AND o.paid_at < ? " +
                         "ORDER BY o.paid_at DESC " +
                         "LIMIT ? OFFSET ?";

        List<PaidOrderReportDto> orders = jdbcTemplate.query(dataSql, (rs, rowNum) -> {
            PaidOrderReportDto dto = new PaidOrderReportDto();
            dto.setOrderId(rs.getLong("id"));
            dto.setOrderCode(rs.getString("order_code"));
            dto.setCustomerName(rs.getString("customer_name"));
            dto.setCustomerPhone(rs.getString("customer_phone"));
            dto.setTableCount(rs.getInt("table_count"));
            
            Timestamp paidTs = rs.getTimestamp("paid_at");
            if (paidTs != null) {
                dto.setPaidAt(paidTs.toInstant().atZone(VN_ZONE).toOffsetDateTime());
            }
            Timestamp eventTs = rs.getTimestamp("event_date_time");
            if (eventTs != null) {
                dto.setEventDateTime(eventTs.toInstant().atZone(VN_ZONE).toOffsetDateTime());
            }

            BigDecimal amount = rs.getBigDecimal("total_amount");
            BigDecimal cogs = rs.getBigDecimal("total_cogs");
            BigDecimal grossProfit = amount.subtract(cogs);
            double margin = amount.compareTo(BigDecimal.ZERO) > 0
                    ? grossProfit.multiply(BigDecimal.valueOf(100)).divide(amount, 2, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            dto.setTotalAmount(amount);
            dto.setCogs(cogs);
            dto.setGrossProfit(grossProfit);
            dto.setGrossMargin(margin);
            return dto;
        }, Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()), pageable.getPageSize(), pageable.getOffset());

        return new PageImpl<>(orders, pageable, totalElements);
    }
}
