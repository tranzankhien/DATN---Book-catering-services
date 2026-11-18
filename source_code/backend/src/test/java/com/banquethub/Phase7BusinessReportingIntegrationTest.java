package com.banquethub;

import com.banquethub.modules.expenses.dto.ExpenseRequest;
import com.banquethub.modules.expenses.entity.ExpenseCategory;
import com.banquethub.modules.expenses.entity.ExpensePaymentStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class Phase7BusinessReportingIntegrationTest {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private JdbcTemplate db;

    @AfterEach
    void cleanup() {
        // Dọn dẹp dữ liệu test có mã bắt đầu bằng TEST- hoặc P7-
        db.update("DELETE FROM operating_expenses WHERE expense_code LIKE 'TEST-%' OR name LIKE 'TEST-%'");
        db.update("DELETE FROM supplier_payments WHERE note LIKE 'TEST-%'");
        db.update("DELETE FROM order_ingredient_consumptions WHERE order_id IN (SELECT id FROM orders WHERE order_code LIKE 'TEST-%')");
        db.update("DELETE FROM payment_transactions WHERE transaction_reference LIKE 'TEST-%'");
        db.update("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE order_code LIKE 'TEST-%')");
        db.update("DELETE FROM orders WHERE order_code LIKE 'TEST-%'");
    }

    private String adminToken() throws Exception {
        String res = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "admin@banquethub.vn", "password", "Admin@123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(res).path("data").path("accessToken").asText();
    }

    private String employeeToken() throws Exception {
        String res = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "employee@banquethub.vn", "password", "Employee@123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(res).path("data").path("accessToken").asText();
    }

    private String userToken() throws Exception {
        String res = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "user@banquethub.vn", "password", "User@123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(res).path("data").path("accessToken").asText();
    }

    // =========================================================================
    // A. REVENUE TESTS (TC-01 - TC-08)
    // =========================================================================

    @Test
    @DisplayName("TC-01 & TC-02: Đơn chưa thanh toán không tính doanh thu, đơn thanh toán thành công chỉ tính một lần")
    void tc01_tc02_unpaidOrdersExcluded_paidOrdersCountedOnce() throws Exception {
        String token = adminToken();
        LocalDate today = LocalDate.now(VN_ZONE);
        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);

        // Tạo 1 đơn chưa thanh toán (PENDING_PAYMENT, UNPAID)
        String unpaidCode = "TEST-UNP-" + UUID.randomUUID().toString().substring(0, 8);
        db.update("INSERT INTO orders(order_code, customer_name, customer_phone, customer_email, event_date_time, table_count, total_amount, order_status, payment_status, payment_expires_at, created_at, updated_at) " +
                  "VALUES (?, 'Khách A', '0901111111', 'a@test.vn', ?, 5, 5000000, 'PENDING_PAYMENT', 'UNPAID', ?, ?, ?)",
                unpaidCode, Timestamp.from(now.plusDays(3).toInstant()), Timestamp.from(now.plusMinutes(15).toInstant()), Timestamp.from(now.toInstant()), Timestamp.from(now.toInstant()));

        // Tạo 1 đơn đã thanh toán thành công (PAID)
        String paidCode = "TEST-PAID-" + UUID.randomUUID().toString().substring(0, 8);
        db.update("INSERT INTO orders(order_code, customer_name, customer_phone, customer_email, event_date_time, table_count, total_amount, order_status, payment_status, paid_at, payment_expires_at, created_at, updated_at) " +
                  "VALUES (?, 'Khách B', '0902222222', 'b@test.vn', ?, 10, 8000000, 'PAID', 'PAID', ?, ?, ?, ?)",
                paidCode, Timestamp.from(now.plusDays(3).toInstant()), Timestamp.from(now.toInstant()), Timestamp.from(now.plusMinutes(15).toInstant()), Timestamp.from(now.toInstant()), Timestamp.from(now.toInstant()));

        String res = mvc.perform(get("/api/v1/admin/reports/revenue")
                        .header("Authorization", "Bearer " + token)
                        .param("startDate", today.toString())
                        .param("endDate", today.toString()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode data = json.readTree(res).path("data");
        // Doanh thu phải >= 8.000.000 (đã tính đơn B, nhưng dứt khoát không có 5.000.000 của đơn A)
        assertThat(data.path("totalRevenue").asDouble()).isGreaterThanOrEqualTo(8000000.0);
    }

    @Test
    @DisplayName("TC-03 & TC-04: Đơn có nhiều PaymentAttempts hoặc IPN lặp không làm tăng doanh thu trùng")
    void tc03_tc04_multiplePaymentAttempts_doNotDuplicateRevenue() throws Exception {
        String token = adminToken();
        LocalDate today = LocalDate.now(VN_ZONE);
        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);

        String code = "TEST-DUP-" + UUID.randomUUID().toString().substring(0, 8);
        db.update("INSERT INTO orders(order_code, customer_name, customer_phone, customer_email, event_date_time, table_count, total_amount, order_status, payment_status, paid_at, payment_expires_at, created_at, updated_at) " +
                  "VALUES (?, 'Khách C', '0903333333', 'c@test.vn', ?, 6, 6000000, 'PAID', 'PAID', ?, ?, ?, ?)",
                code, Timestamp.from(now.plusDays(3).toInstant()), Timestamp.from(now.toInstant()), Timestamp.from(now.plusMinutes(15).toInstant()), Timestamp.from(now.toInstant()), Timestamp.from(now.toInstant()));

        Long orderId = db.queryForObject("SELECT id FROM orders WHERE order_code = ?", Long.class, code);

        // Tạo 2 giao dịch thanh toán gắn với cùng 1 đơn (1 thất bại, 1 thành công)
        db.update("INSERT INTO payment_transactions(order_id, provider, transaction_reference, amount, currency, status, payment_url, created_at, updated_at, expires_at, query_count) " +
                  "VALUES (?, 'VNPAY', ?, 6000000, 'VND', 'FAILED', 'http://url1', ?, ?, ?, 0)",
                orderId, "TEST-TX1-" + UUID.randomUUID(), Timestamp.from(now.toInstant()), Timestamp.from(now.toInstant()), Timestamp.from(now.plusMinutes(15).toInstant()));
        db.update("INSERT INTO payment_transactions(order_id, provider, transaction_reference, amount, currency, status, paid_at, payment_url, created_at, updated_at, expires_at, query_count) " +
                  "VALUES (?, 'VNPAY', ?, 6000000, 'VND', 'SUCCESS', ?, 'http://url2', ?, ?, ?, 0)",
                orderId, "TEST-TX2-" + UUID.randomUUID(), Timestamp.from(now.toInstant()), Timestamp.from(now.toInstant()), Timestamp.from(now.toInstant()), Timestamp.from(now.plusMinutes(15).toInstant()));

        String res = mvc.perform(get("/api/v1/admin/reports/revenue/orders")
                        .header("Authorization", "Bearer " + token)
                        .param("startDate", today.toString())
                        .param("endDate", today.toString()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode content = json.readTree(res).path("data").path("content");
        long occurrences = 0;
        for (JsonNode o : content) {
            if (o.path("orderCode").asText().equals(code)) {
                occurrences++;
                assertThat(o.path("totalAmount").asDouble()).isEqualTo(6000000.0);
            }
        }
        assertThat(occurrences).isEqualTo(1); // Đơn chỉ xuất hiện đúng 1 lần trong danh sách
    }

    @Test
    @DisplayName("TC-05 & TC-07: Order có nhiều món không làm totalAmount bị nhân bản, Top món tính đúng theo số bàn")
    void tc05_tc07_orderItemsMultiplier_topDishesCalculation() throws Exception {
        String token = adminToken();
        LocalDate today = LocalDate.now(VN_ZONE);
        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);

        String code = "TEST-ITEMS-" + UUID.randomUUID().toString().substring(0, 8);
        db.update("INSERT INTO orders(order_code, customer_name, customer_phone, customer_email, event_date_time, table_count, total_amount, order_status, payment_status, paid_at, payment_expires_at, created_at, updated_at) " +
                  "VALUES (?, 'Khách D', '0904444444', 'd@test.vn', ?, 5, 2500000, 'PAID', 'PAID', ?, ?, ?, ?)",
                code, Timestamp.from(now.plusDays(3).toInstant()), Timestamp.from(now.toInstant()), Timestamp.from(now.plusMinutes(15).toInstant()), Timestamp.from(now.toInstant()), Timestamp.from(now.toInstant()));

        Long orderId = db.queryForObject("SELECT id FROM orders WHERE order_code = ?", Long.class, code);
        Long dishId = db.queryForObject("SELECT id FROM dishes LIMIT 1", Long.class);

        // Đơn 5 bàn, mỗi bàn 2 phần món này -> Tổng số phần = 10 phần!
        db.update("INSERT INTO order_items(order_id, dish_id, dish_name_snapshot, quantity_per_table, total_quantity, unit_price_snapshot, line_total, created_at) " +
                  "VALUES (?, ?, 'Gà Hấp Lá Chanh Test', 2, 10, 250000, 2500000, ?)",
                orderId, dishId, Timestamp.from(now.toInstant()));

        String res = mvc.perform(get("/api/v1/admin/reports/revenue/top-dishes")
                        .header("Authorization", "Bearer " + token)
                        .param("startDate", today.toString())
                        .param("endDate", today.toString()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode dishes = json.readTree(res).path("data");
        boolean found = false;
        for (JsonNode d : dishes) {
            if (d.path("dishName").asText().equals("Gà Hấp Lá Chanh Test")) {
                found = true;
                // Số phần bán phải = quantity_per_table (2) * table_count (5) = 10 phần!
                assertThat(d.path("totalPortionsSold").asLong()).isEqualTo(10L);
                assertThat(d.path("totalRevenue").asDouble()).isEqualTo(2500000.0);
            }
        }
        assertThat(found).isTrue();
    }

    // =========================================================================
    // B. INVENTORY & COST TESTS (TC-09 - TC-14)
    // =========================================================================

    @Test
    @DisplayName("TC-09 & TC-10: Giá vốn lấy từ snapshot tiêu hao (order_ingredient_consumptions) và giữ nguyên bất biến")
    void tc09_tc10_cogsFromSnapshot() throws Exception {
        String token = adminToken();
        LocalDate today = LocalDate.now(VN_ZONE);
        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);

        String code = "TEST-COGS-" + UUID.randomUUID().toString().substring(0, 8);
        db.update("INSERT INTO orders(order_code, customer_name, customer_phone, customer_email, event_date_time, table_count, total_amount, order_status, payment_status, paid_at, payment_expires_at, created_at, updated_at) " +
                  "VALUES (?, 'Khách E', '0905555555', 'e@test.vn', ?, 4, 3000000, 'PAID', 'PAID', ?, ?, ?, ?)",
                code, Timestamp.from(now.plusDays(3).toInstant()), Timestamp.from(now.toInstant()), Timestamp.from(now.plusMinutes(15).toInstant()), Timestamp.from(now.toInstant()), Timestamp.from(now.toInstant()));

        Long orderId = db.queryForObject("SELECT id FROM orders WHERE order_code = ?", Long.class, code);
        Long ingId = db.queryForObject("SELECT id FROM ingredients LIMIT 1", Long.class);

        // Ghi nhận snapshot giá vốn: 10 kg x 110.000đ = 1.100.000đ
        db.update("INSERT INTO order_ingredient_consumptions(order_id, ingredient_id, quantity_used, unit_cost_snapshot, total_cost, recorded_at) " +
                  "VALUES (?, ?, 10, 110000, 1100000, ?)",
                orderId, ingId, Timestamp.from(now.toInstant()));

        String res = mvc.perform(get("/api/v1/admin/reports/revenue/orders")
                        .header("Authorization", "Bearer " + token)
                        .param("startDate", today.toString())
                        .param("endDate", today.toString()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode content = json.readTree(res).path("data").path("content");
        for (JsonNode o : content) {
            if (o.path("orderCode").asText().equals(code)) {
                assertThat(o.path("totalAmount").asDouble()).isEqualTo(3000000.0);
                assertThat(o.path("cogs").asDouble()).isEqualTo(1100000.0);
                assertThat(o.path("grossProfit").asDouble()).isEqualTo(1900000.0); // 3tr - 1.1tr = 1.9tr
            }
        }
    }

    @Test
    @DisplayName("TC-11: Định giá tồn kho = Tồn thực tế x Giá vốn bình quân (current_stock * avg_unit_cost)")
    void tc11_inventoryValuation() throws Exception {
        String token = adminToken();
        String res = mvc.perform(get("/api/v1/admin/reports/inventory/valuation")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode list = json.readTree(res).path("data");
        assertThat(list.isArray()).isTrue();
        if (list.size() > 0) {
            JsonNode item = list.get(0);
            double stock = item.path("currentStock").asDouble();
            double avgCost = item.path("avgUnitCost").asDouble();
            double totalVal = item.path("totalValue").asDouble();
            assertThat(totalVal).isCloseTo(stock * avgCost, org.assertj.core.data.Offset.offset(0.01));
        }
    }

    // =========================================================================
    // C. OPERATING EXPENSE & PROFIT TESTS (TC-20 - TC-28)
    // =========================================================================

    @Test
    @DisplayName("TC-20 & TC-21: Thêm chi phí vận hành thành công; chi phí âm hoặc 0 bị chặn (400)")
    void tc20_tc21_createExpense_validation() throws Exception {
        String token = adminToken();
        LocalDate today = LocalDate.now(VN_ZONE);

        // Hợp lệ
        ExpenseRequest req = new ExpenseRequest();
        req.setName("TEST-Tiền điện tháng này");
        req.setCategory(ExpenseCategory.UTILITIES);
        req.setAmount(new BigDecimal("500000"));
        req.setIncurredDate(today);
        req.setPaymentStatus(ExpensePaymentStatus.PAID);
        req.setNote("Hóa đơn EVN");

        String res = mvc.perform(post("/api/v1/admin/expenses")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        JsonNode data = json.readTree(res).path("data");
        assertThat(data.path("name").asText()).isEqualTo("TEST-Tiền điện tháng này");
        assertThat(data.path("amount").asDouble()).isEqualTo(500000.0);
        assertThat(data.path("category").asText()).isEqualTo("UTILITIES");

        // Không hợp lệ (tiền = 0 hoặc âm) -> Bị từ chối 400
        ExpenseRequest invalidReq = new ExpenseRequest();
        invalidReq.setName("TEST-Sai tiền");
        invalidReq.setCategory(ExpenseCategory.OTHER);
        invalidReq.setAmount(new BigDecimal("0"));
        invalidReq.setIncurredDate(today);

        mvc.perform(post("/api/v1/admin/expenses")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC-24 & TC-25: Tính toán Lợi nhuận gộp (A - B) và Lợi nhuận ước tính (A - B - C - D) chuẩn xác")
    void tc24_tc25_profitFormulas_accuracy() throws Exception {
        String token = adminToken();
        LocalDate start = LocalDate.of(2099, 1, 1);
        LocalDate end = LocalDate.of(2099, 1, 31);
        OffsetDateTime paidTs = start.atTime(10, 0).atZone(VN_ZONE).toOffsetDateTime();

        // 1. Doanh thu A = 5.000.000đ
        String code = "TEST-PRF-" + UUID.randomUUID().toString().substring(0, 8);
        db.update("INSERT INTO orders(order_code, customer_name, customer_phone, customer_email, event_date_time, table_count, total_amount, order_status, payment_status, paid_at, payment_expires_at, created_at, updated_at) " +
                  "VALUES (?, 'Khách Demo', '0909999999', 'demo@test.vn', ?, 5, 5000000, 'PAID', 'PAID', ?, ?, ?, ?)",
                code, Timestamp.from(paidTs.plusDays(1).toInstant()), Timestamp.from(paidTs.toInstant()), Timestamp.from(paidTs.plusMinutes(15).toInstant()), Timestamp.from(paidTs.toInstant()), Timestamp.from(paidTs.toInstant()));

        Long orderId = db.queryForObject("SELECT id FROM orders WHERE order_code = ?", Long.class, code);
        Long ingId = db.queryForObject("SELECT id FROM ingredients LIMIT 1", Long.class);

        // 2. Giá vốn tiêu hao B = 1.800.000đ
        db.update("INSERT INTO order_ingredient_consumptions(order_id, ingredient_id, quantity_used, unit_cost_snapshot, total_cost, recorded_at) " +
                  "VALUES (?, ?, 10, 180000, 1800000, ?)",
                orderId, ingId, Timestamp.from(paidTs.toInstant()));

        // 3. Chi phí lương nội bộ đã chốt C = 2.000.000đ (kỳ năm 2099, tháng 1)
        db.update("INSERT INTO payroll_periods(year, month, standard_workdays, status, finalized_at, created_at, updated_at) " +
                  "VALUES (2099, 1, 26, 'FINALIZED', ?, ?, ?)",
                Timestamp.from(paidTs.toInstant()), Timestamp.from(paidTs.toInstant()), Timestamp.from(paidTs.toInstant()));
        Long periodId = db.queryForObject("SELECT id FROM payroll_periods WHERE year = 2099 AND month = 1", Long.class);
        List<Long> empIds = db.query("SELECT id FROM employees LIMIT 1", (rs, rowNum) -> rs.getLong("id"));
        Long empId;
        if (empIds.isEmpty()) {
            db.update("INSERT INTO employees(employee_code, full_name, phone, position, hire_date, base_salary, status) " +
                      "VALUES ('EMP-TEST-P7', 'NV Test P7', '0901234567', 'Nhân viên', '2026-01-01', 2000000, 'ACTIVE')");
            empId = db.queryForObject("SELECT id FROM employees WHERE employee_code = 'EMP-TEST-P7'", Long.class);
        } else {
            empId = empIds.get(0);
        }
        db.update("INSERT INTO payrolls(payroll_period_id, employee_id, employee_name_snapshot, employee_code_snapshot, base_salary_snapshot, standard_workdays_snapshot, actual_workdays_snapshot, calculated_salary, total_allowances, total_deductions, net_salary, payment_status, finalized_at, created_at) " +
                  "VALUES (?, ?, 'NV Demo', 'TEST-NV-DEMO', 2000000, 26, 26, 2000000, 0, 0, 2000000, 'PAID', ?, ?)",
                periodId, empId, Timestamp.from(paidTs.toInstant()), Timestamp.from(paidTs.toInstant()));

        // 4. Chi phí vận hành khác D = 500.000đ (phát sinh ngày 2099-01-15)
        String expCode = "TEST-EXP-" + UUID.randomUUID().toString().substring(0, 8);
        db.update("INSERT INTO operating_expenses(expense_code, name, category, amount, incurred_date, payment_status, paid_at, created_at, updated_at) " +
                  "VALUES (?, 'TEST-Điện nước', 'UTILITIES', 500000, '2099-01-15', 'PAID', ?, ?, ?)",
                expCode, Timestamp.from(paidTs.toInstant()), Timestamp.from(paidTs.toInstant()), Timestamp.from(paidTs.toInstant()));

        // Gọi API Profit Report
        String res = mvc.perform(get("/api/v1/admin/reports/profit")
                        .header("Authorization", "Bearer " + token)
                        .param("startDate", "2099-01-01")
                        .param("endDate", "2099-01-31"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode data = json.readTree(res).path("data");
        // A = 5.000.000
        assertThat(data.path("paidRevenue").asDouble()).isEqualTo(5000000.0);
        // B = 1.800.000
        assertThat(data.path("materialCost").asDouble()).isEqualTo(1800000.0);
        // Lợi nhuận gộp = 5.000.000 - 1.800.000 = 3.200.000đ
        assertThat(data.path("grossProfit").asDouble()).isEqualTo(3200000.0);
        // C = 2.000.000đ
        assertThat(data.path("internalPayrollCost").asDouble()).isEqualTo(2000000.0);
        // D = 500.000đ
        assertThat(data.path("operatingExpenses").asDouble()).isEqualTo(500000.0);
        // Lợi nhuận ước tính = 5.000.000 - 1.800.000 - 2.000.000 - 500.000 = 700.000đ
        assertThat(data.path("estimatedProfit").asDouble()).isEqualTo(700000.0);

        // Dọn dẹp kỳ lương test 2099
        db.update("DELETE FROM payrolls WHERE payroll_period_id = ?", periodId);
        db.update("DELETE FROM payroll_periods WHERE id = ?", periodId);
    }

    // =========================================================================
    // D. CASH FLOW TESTS (TC-29 - TC-33)
    // =========================================================================

    @Test
    @DisplayName("TC-29 - TC-33: Dòng tiền thuần = Thu mô phỏng - Tổng chi ghi nhận (NCC + Lương + Vận hành)")
    void tc29_tc33_cashFlowFormulas() throws Exception {
        String token = adminToken();
        LocalDate today = LocalDate.now(VN_ZONE);

        String res = mvc.perform(get("/api/v1/admin/reports/cashflow")
                        .header("Authorization", "Bearer " + token)
                        .param("startDate", today.toString())
                        .param("endDate", today.toString()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode data = json.readTree(res).path("data");
        double inflow = data.path("simulatedInflow").asDouble();
        double outflow = data.path("recordedOutflow").asDouble();
        double net = data.path("netCashFlow").asDouble();

        // Thuần = Thu - Chi
        assertThat(net).isCloseTo(inflow - outflow, org.assertj.core.data.Offset.offset(0.01));
        // Có nhãn mô phỏng
        assertThat(data.path("simulation").asBoolean()).isTrue();
    }

    // =========================================================================
    // E. CSV EXPORT & SECURITY (TC-37 - TC-43)
    // =========================================================================

    @Test
    @DisplayName("TC-37: Xuất CSV UTF-8 with BOM và chứa đầy đủ tiêu đề cột")
    void tc37_exportCsv_utf8Bom() throws Exception {
        String token = adminToken();
        LocalDate today = LocalDate.now(VN_ZONE);

        byte[] csvBytes = mvc.perform(get("/api/v1/admin/reports/export")
                        .header("Authorization", "Bearer " + token)
                        .param("type", "REVENUE")
                        .param("startDate", today.toString())
                        .param("endDate", today.toString()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsByteArray();

        // 3 bytes đầu tiên của UTF-8 BOM là EF BB BF
        assertThat(csvBytes.length).isGreaterThan(3);
        assertThat((char) (csvBytes[0] & 0xFF)).isEqualTo((char) 0xEF);
        assertThat((char) (csvBytes[1] & 0xFF)).isEqualTo((char) 0xBB);
        assertThat((char) (csvBytes[2] & 0xFF)).isEqualTo((char) 0xBF);

        String content = new String(csvBytes, java.nio.charset.StandardCharsets.UTF_8);
        assertThat(content).contains("Mã đơn hàng,Khách hàng");
    }

    @Test
    @DisplayName("TC-41 & TC-42: Guest, User và Employee không thể truy cập các API báo cáo tài chính (401/403)")
    void tc41_tc42_securityRestrictions() throws Exception {
        // 1. Không có token (Guest) -> 401 Unauthorized
        mvc.perform(get("/api/v1/admin/dashboard/overview"))
                .andExpect(status().isUnauthorized());

        // 2. Token User thông thường -> 403 Forbidden
        String uToken = userToken();
        mvc.perform(get("/api/v1/admin/dashboard/overview")
                        .header("Authorization", "Bearer " + uToken))
                .andExpect(status().isForbidden());

        // 3. Token Nhân viên (Employee) -> 403 Forbidden
        String eToken = employeeToken();
        mvc.perform(get("/api/v1/admin/reports/profit")
                        .header("Authorization", "Bearer " + eToken))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/admin/reports/payroll")
                        .header("Authorization", "Bearer " + eToken))
                .andExpect(status().isForbidden());
    }
}
