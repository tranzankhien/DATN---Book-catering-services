package com.banquethub.modules.reports.service;

import com.banquethub.modules.reports.dto.IngredientValuationDto;
import com.banquethub.modules.reports.dto.InventoryReportResponse;
import com.banquethub.modules.reports.dto.SupplierPurchaseDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class InventoryReportService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private final JdbcTemplate jdbcTemplate;

    public InventoryReportService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public InventoryReportResponse getInventoryOverview(LocalDate startDate, LocalDate endDate) {
        OffsetDateTime start = startDate.atStartOfDay(VN_ZONE).toOffsetDateTime();
        OffsetDateTime end = endDate.plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();

        InventoryReportResponse resp = new InventoryReportResponse();

        // 1. Tổng số nguyên liệu & Tổng định giá tồn kho ước tính (Tồn thực tế x Giá vốn bình quân)
        String stockSql = "SELECT COUNT(*) AS total_cnt, " +
                          "       COALESCE(SUM(current_stock * avg_unit_cost), 0) AS total_val, " +
                          "       COUNT(CASE WHEN current_stock <= min_stock_threshold THEN 1 END) AS low_stock_cnt " +
                          "FROM ingredients WHERE active = true";
        jdbcTemplate.query(stockSql, (rs) -> {
            resp.setTotalIngredientsCount(rs.getLong("total_cnt"));
            resp.setEstimatedInventoryValuation(rs.getBigDecimal("total_val"));
            resp.setLowStockCount(rs.getLong("low_stock_cnt"));
        });

        // 2. Tổng giá trị nhập nguyên liệu đã xác nhận (StockReceipt CONFIRMED) trong kỳ
        String purchaseSql = "SELECT COALESCE(SUM(total_amount), 0) " +
                             "FROM stock_receipts " +
                             "WHERE status = 'CONFIRMED' AND confirmed_at >= ? AND confirmed_at < ?";
        BigDecimal purchases = jdbcTemplate.queryForObject(purchaseSql, BigDecimal.class,
                Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));
        resp.setConfirmedPurchasesAmount(purchases != null ? purchases : BigDecimal.ZERO);

        // 3. Tổng giá vốn nguyên liệu tiêu hao đã xuất cho đơn hàng trong kỳ
        String cogsSql = "SELECT COALESCE(SUM(oic.total_cost), 0) " +
                         "FROM order_ingredient_consumptions oic " +
                         "JOIN orders o ON o.id = oic.order_id " +
                         "WHERE o.payment_status = 'PAID' AND o.paid_at >= ? AND o.paid_at < ?";
        BigDecimal cogs = jdbcTemplate.queryForObject(cogsSql, BigDecimal.class,
                Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));
        resp.setTotalConsumedCost(cogs != null ? cogs : BigDecimal.ZERO);

        return resp;
    }

    public List<IngredientValuationDto> getIngredientValuationList() {
        String sql = "SELECT id, name, unit, current_stock, avg_unit_cost, " +
                     "       (current_stock * avg_unit_cost) AS total_val, " +
                     "       min_stock_threshold " +
                     "FROM ingredients " +
                     "WHERE active = true " +
                     "ORDER BY total_val DESC, name ASC";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            IngredientValuationDto dto = new IngredientValuationDto();
            dto.setIngredientId(rs.getLong("id"));
            dto.setName(rs.getString("name"));
            dto.setUnit(rs.getString("unit"));
            dto.setCurrentStock(rs.getBigDecimal("current_stock"));
            dto.setAvgUnitCost(rs.getBigDecimal("avg_unit_cost"));
            dto.setTotalValue(rs.getBigDecimal("total_val"));
            BigDecimal threshold = rs.getBigDecimal("min_stock_threshold");
            dto.setMinStockThreshold(threshold);
            dto.setLowStock(dto.getCurrentStock().compareTo(threshold) <= 0);
            return dto;
        });
    }

    public List<SupplierPurchaseDto> getSupplierPurchases(LocalDate startDate, LocalDate endDate) {
        OffsetDateTime start = startDate.atStartOfDay(VN_ZONE).toOffsetDateTime();
        OffsetDateTime end = endDate.plusDays(1).atStartOfDay(VN_ZONE).toOffsetDateTime();

        String sql = "SELECT s.id, s.name, s.phone, " +
                     "       COUNT(sr.id) AS confirmed_count, " +
                     "       COALESCE(SUM(sr.total_amount), 0) AS total_purchased, " +
                     "       COALESCE(SUM(sr.amount_paid), 0) AS total_paid, " +
                     "       COALESCE(SUM(sr.total_amount - sr.amount_paid), 0) AS debt " +
                     "FROM suppliers s " +
                     "JOIN stock_receipts sr ON sr.supplier_id = s.id " +
                     "WHERE sr.status = 'CONFIRMED' AND sr.confirmed_at >= ? AND sr.confirmed_at < ? " +
                     "GROUP BY s.id, s.name, s.phone " +
                     "ORDER BY total_purchased DESC";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            SupplierPurchaseDto dto = new SupplierPurchaseDto();
            dto.setSupplierId(rs.getLong("id"));
            dto.setSupplierName(rs.getString("name"));
            dto.setSupplierPhone(rs.getString("phone"));
            dto.setConfirmedReceiptsCount(rs.getLong("confirmed_count"));
            dto.setTotalPurchasedAmount(rs.getBigDecimal("total_purchased"));
            dto.setTotalPaidAmount(rs.getBigDecimal("total_paid"));
            dto.setOutstandingDebt(rs.getBigDecimal("debt"));
            return dto;
        }, Timestamp.from(start.toInstant()), Timestamp.from(end.toInstant()));
    }
}
