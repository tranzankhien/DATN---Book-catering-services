package com.banquethub;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Run only against the disposable PostgreSQL test database, like the Phase 1–3 suite. */
@SpringBootTest(properties = {"SEPAY_MERCHANT_ID=TESTMERCHANT", "SEPAY_SECRET_KEY=checkout-test-secret",
        "SEPAY_IPN_SECRET=ipn-test-secret", "app.email.worker-enabled=false"})
@AutoConfigureMockMvc
class Phase4IntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate db;
    @Autowired com.banquethub.modules.reservations.service.ReservationExpiryScheduler expiryScheduler;

    @AfterEach
    void cleanupP4TestData() {
        db.update("DELETE FROM email_outbox WHERE order_id IN (SELECT id FROM orders WHERE customer_email LIKE '%@example.test' OR customer_name IN ('Phase Four', 'Map Test'))");
        db.update("DELETE FROM payment_transactions WHERE order_id IN (SELECT id FROM orders WHERE customer_email LIKE '%@example.test' OR customer_name IN ('Phase Four', 'Map Test'))");
        db.update("DELETE FROM order_ingredient_consumptions WHERE order_id IN (SELECT id FROM orders WHERE customer_email LIKE '%@example.test' OR customer_name IN ('Phase Four', 'Map Test'))");
        db.update("DELETE FROM order_status_histories WHERE order_id IN (SELECT id FROM orders WHERE customer_email LIKE '%@example.test' OR customer_name IN ('Phase Four', 'Map Test'))");
        db.update("DELETE FROM stock_reservation_items WHERE reservation_id IN (SELECT id FROM stock_reservations WHERE order_id IN (SELECT id FROM orders WHERE customer_email LIKE '%@example.test' OR customer_name IN ('Phase Four', 'Map Test')))");
        db.update("DELETE FROM stock_reservations WHERE order_id IN (SELECT id FROM orders WHERE customer_email LIKE '%@example.test' OR customer_name IN ('Phase Four', 'Map Test'))");
        db.update("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_email LIKE '%@example.test' OR customer_name IN ('Phase Four', 'Map Test'))");
        db.update("DELETE FROM orders WHERE customer_email LIKE '%@example.test' OR customer_name IN ('Phase Four', 'Map Test')");

        db.update("DELETE FROM order_items WHERE dish_id IN (SELECT id FROM dishes WHERE code LIKE 'P4-%')");
        db.update("DELETE FROM recipe_items WHERE dish_id IN (SELECT id FROM dishes WHERE code LIKE 'P4-%')");
        db.update("DELETE FROM recipe_items WHERE ingredient_id IN (SELECT id FROM ingredients WHERE code LIKE 'P4-%')");
        db.update("DELETE FROM stock_movements WHERE ingredient_id IN (SELECT id FROM ingredients WHERE code LIKE 'P4-%')");
        db.update("DELETE FROM dishes WHERE code LIKE 'P4-%'");
        db.update("DELETE FROM ingredients WHERE code LIKE 'P4-%'");
    }
    record Fixture(long order, long ingredient, long dish, String token, BigDecimal amount) {}

    String token(String email, String password) throws Exception {
        return body(mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email, "password", password)))))
                .path("data").path("accessToken").asText();
    }
    JsonNode body(org.springframework.test.web.servlet.ResultActions result) throws Exception {
        return json.readTree(result.andExpect(status().is2xxSuccessful()).andReturn().getResponse().getContentAsString());
    }
    Fixture fixture() throws Exception {
        String code = "P4-" + UUID.randomUUID().toString().substring(0, 12);
        long ingredient = db.queryForObject("INSERT INTO ingredients(code,name,unit,current_stock,avg_unit_cost) VALUES (?,?,'kg',100,90000) RETURNING id", Long.class, code, code);
        long category = db.queryForObject("SELECT min(id) FROM dish_categories", Long.class);
        long dish = db.queryForObject("INSERT INTO dishes(code,name,price,category_id) VALUES (?,?,250000,?) RETURNING id", Long.class, code, code, category);
        db.update("INSERT INTO recipe_items(dish_id,ingredient_id,quantity) VALUES (?,?,1)", dish, ingredient);
        String token = token("user@banquethub.vn", "User@123");
        JsonNode order = body(mvc.perform(post("/api/v1/orders").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of(
                        "customerName", "Phase Four", "customerPhone", "0912345678", "customerEmail", "payment-test@example.test",
                        "eventDateTime", OffsetDateTime.now().plusDays(7).toString(), "tableCount", 5, "guestCount", 50,
                        "eventLocation", "Test Hall", "items", List.of(Map.of("dishId", dish, "quantityPerTable", 1))))))).path("data");
        return new Fixture(order.path("id").asLong(), ingredient, dish, token, order.path("totalAmount").decimalValue());
    }
    @Test void selectedMapPointIsPersistedAndReturned() throws Exception {
        Fixture f = fixture();
        Map<String,Object> payload = Map.of(
            "customerName", "Map Test", "customerPhone", "0912345678", "customerEmail", "map@example.test",
            "eventDateTime", OffsetDateTime.now().plusDays(7).toString(), "tableCount", 1, "guestCount", 10,
            "eventLocation", "Chương Mỹ, Hà Nội", "eventLatitude", new BigDecimal("20.913456"),
            "eventLongitude", new BigDecimal("105.697890"), "items", List.of(Map.of("dishId", f.dish, "quantityPerTable", 1)));
        JsonNode order = body(mvc.perform(post("/api/v1/orders").header("Authorization", "Bearer " + f.token)
            .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(payload)))).path("data");
        var detail = body(mvc.perform(get("/api/v1/orders/{id}", order.path("id").asLong())
            .header("Authorization", "Bearer " + f.token))).path("data");
        assertThat(detail.path("eventLatitude").decimalValue()).isEqualByComparingTo("20.913456");
        assertThat(detail.path("eventLongitude").decimalValue()).isEqualByComparingTo("105.697890");
    }

    JsonNode create(Fixture f) throws Exception {
        return body(mvc.perform(post("/api/v1/payments/sepay/create").header("Authorization", "Bearer " + f.token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"orderId\":" + f.order + ",\"amount\":1}"))).path("data");
    }
    com.fasterxml.jackson.databind.node.ObjectNode notification(Fixture f, JsonNode attempt) {
        var payload = json.createObjectNode().put("notification_type", "ORDER_PAID");
        payload.putObject("order").put("order_invoice_number", attempt.path("transactionReference").asText())
            .put("order_amount", f.amount.toPlainString()).put("order_currency", "VND").put("order_status", "CAPTURED");
        payload.putObject("transaction").put("id", "tx-" + f.order).put("transaction_id", Long.toString(f.order))
            .put("transaction_type", "PAYMENT").put("transaction_status", "APPROVED")
            .put("transaction_amount", f.amount.toPlainString()).put("transaction_currency", "VND")
            .put("transaction_date", OffsetDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return payload;
    }

    JsonNode ipn(JsonNode payload) throws Exception {
        return body(mvc.perform(notificationRequest(payload, "ipn-test-secret")));
    }

    MockHttpServletRequestBuilder notificationRequest(JsonNode payload, String key) throws Exception {
        return post("/api/v1/payments/sepay/ipn").header("X-Secret-Key", key)
            .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(payload));
    }
    String orderStatus(Fixture f) { return db.queryForObject("SELECT order_status FROM orders WHERE id=?", String.class, f.order); }
    BigDecimal stock(Fixture f) { return db.queryForObject("SELECT current_stock FROM ingredients WHERE id=?", BigDecimal.class, f.ingredient); }
    long count(String table, Fixture f) { return db.queryForObject("SELECT count(*) FROM " + table + " WHERE order_id=?", Long.class, f.order); }
    void settled(Fixture f) {
        assertThat(orderStatus(f)).isEqualTo("PAID"); assertThat(stock(f)).isEqualByComparingTo("95");
        assertThat(count("order_ingredient_consumptions", f)).isEqualTo(1);
        assertThat(db.queryForObject("SELECT status FROM stock_reservations WHERE order_id=?", String.class, f.order)).isEqualTo("CONSUMED");
        assertThat(db.queryForObject("SELECT count(*) FROM stock_movements WHERE reference_type='ORDER' AND reference_id=? AND movement_type='EXPORT'", Long.class, f.order)).isEqualTo(1);
    }

    @Test void paymentUrlUsesServerAmountAndDoesNotDeductStock() throws Exception {
        Fixture f = fixture(); JsonNode first = create(f); JsonNode second = create(f);
        assertThat(first.path("checkoutUrl").asText()).isEqualTo("https://pay-sandbox.sepay.vn/v1/checkout/init");
        assertThat(first.path("fields").path("order_amount").asText()).isEqualTo("1250000");
        assertThat(first.path("fields").path("payment_method").asText()).isEqualTo("BANK_TRANSFER");
        assertThat(first.path("fields").path("signature").asText()).isNotBlank();
        assertThat(first.toString()).doesNotContain("checkout-test-secret", "ipn-test-secret");
        assertThat(first.path("transactionReference").asText()).isNotBlank();
        assertThat(second.path("paymentAttemptId").asLong()).isEqualTo(first.path("paymentAttemptId").asLong());
        assertThat(stock(f)).isEqualByComparingTo("100"); assertThat(orderStatus(f)).isEqualTo("PENDING_PAYMENT");
    }
    @Test void wrongSignatureAndWrongAmountLeaveEverythingUnpaid() throws Exception {
        Fixture f = fixture(); var p = notification(f, create(f));
        mvc.perform(notificationRequest(p, "incorrect")).andExpect(status().isUnauthorized());
        p.withObject("order").put("order_amount", "100");
        mvc.perform(notificationRequest(p, "ipn-test-secret")).andExpect(status().isBadRequest());
        assertThat(orderStatus(f)).isEqualTo("PENDING_PAYMENT"); assertThat(stock(f)).isEqualByComparingTo("100");
        assertThat(count("order_ingredient_consumptions", f)).isZero();
    }
    @Test void signedSuccessIsIdempotentAndCostsUseReservationSnapshot() throws Exception {
        Fixture f = fixture(); var p = notification(f, create(f));
        db.update("UPDATE recipe_items SET quantity=9 WHERE dish_id=?", f.dish);
        assertThat(ipn(p).path("success").asBoolean()).isTrue();
        assertThat(ipn(p).path("success").asBoolean()).isTrue(); settled(f);
        BigDecimal cost = db.queryForObject("SELECT total_cost FROM order_ingredient_consumptions WHERE order_id=?", BigDecimal.class, f.order);
        assertThat(cost).isEqualByComparingTo("450000");
        db.update("UPDATE ingredients SET avg_unit_cost=120000 WHERE id=?", f.ingredient);
        assertThat(db.queryForObject("SELECT total_cost FROM order_ingredient_consumptions WHERE order_id=?", BigDecimal.class, f.order)).isEqualByComparingTo(cost);
        mvc.perform(post("/api/v1/payments/sepay/create").header("Authorization", "Bearer " + f.token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"orderId\":" + f.order + "}")).andExpect(status().is4xxClientError());
    }
    @Test void concurrentSignedNotificationsDeductExactlyOnce() throws Exception {
        Fixture f = fixture(); var p = notification(f, create(f));
        ExecutorService pool = Executors.newFixedThreadPool(2); CountDownLatch start = new CountDownLatch(1);
        try {
            Callable<Boolean> task = () -> { start.await(); return ipn(p).path("success").asBoolean(); };
            Future<Boolean> one = pool.submit(task), two = pool.submit(task); start.countDown();
            assertThat(List.of(one.get(30, TimeUnit.SECONDS), two.get(30, TimeUnit.SECONDS))).containsExactly(true, true);
        } finally { pool.shutdownNow(); }
        settled(f);
    }
    @Test void openPaymentPreventsCancellationUntilAttemptExpires() throws Exception {
        Fixture f = fixture();
        create(f);
        var cancel = post("/api/v1/orders/{id}/cancel", f.order).header("Authorization", "Bearer " + f.token);
        mvc.perform(cancel).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Phiên thanh toán SePay")));
        assertThat(orderStatus(f)).isEqualTo("PENDING_PAYMENT");
        assertThat(db.queryForObject("SELECT status FROM stock_reservations WHERE order_id=?", String.class, f.order))
            .isEqualTo("ACTIVE");

        db.update("UPDATE payment_transactions SET expires_at=now()-interval '1 second' WHERE order_id=?",f.order);
        mvc.perform(cancel).andExpect(status().isOk());
        assertThat(orderStatus(f)).isEqualTo("CANCELLED");
        assertThat(db.queryForObject("SELECT status FROM stock_reservations WHERE order_id=?", String.class, f.order))
            .isEqualTo("RELEASED");
    }

    @Test void adminOverviewCountsCurrentOperationalStates() throws Exception {
        Fixture f = fixture();
        String admin = token("admin@banquethub.vn", "Admin@123");
        var request = get("/api/v1/admin/overview").header("Authorization", "Bearer " + admin);
        mvc.perform(get("/api/v1/admin/overview").header("Authorization", "Bearer " + f.token))
            .andExpect(status().isForbidden());
        var before = body(mvc.perform(request)).path("data");
        assertThat(before.path("pendingPayment").asLong()).isPositive();
        var awaiting = get("/api/v1/admin/orders")
            .param("orderStatus", "PENDING_PAYMENT").param("paymentStatus", "UNPAID")
            .param("awaitingPayment", "true").header("Authorization", "Bearer " + admin);
        assertThat(body(mvc.perform(awaiting)).path("data").path("totalElements").asLong())
            .isEqualTo(before.path("pendingPayment").asLong());
        assertThat(ipn(notification(f, create(f))).path("success").asBoolean()).isTrue();
        db.update("UPDATE email_outbox SET status='FAILED' WHERE order_id=?", f.order);
        var after = body(mvc.perform(request)).path("data");
        assertThat(after.path("pendingPayment").asLong()).isEqualTo(before.path("pendingPayment").asLong() - 1);
        assertThat(after.path("paid").asLong()).isEqualTo(before.path("paid").asLong() + 1);
        assertThat(after.path("failedEmails").asLong()).isEqualTo(before.path("failedEmails").asLong() + 1);
        assertThat(body(mvc.perform(get("/api/v1/admin/notifications").param("status", "FAILED")
            .header("Authorization", "Bearer " + admin))).path("data").path("totalElements").asLong())
            .isEqualTo(after.path("failedEmails").asLong());
        assertThat(after.has("preparing") && after.has("completed") && after.has("paymentReview")).isTrue();
    }

    @Test void ownershipAndRoleChecksProtectPayments() throws Exception {
        Fixture f = fixture(); JsonNode a = create(f);
        String email = "phase4-" + UUID.randomUUID() + "@example.test";
        body(mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("email", email, "password", "User@123", "fullName", "Other User", "phone", "0912345678")))));
        String other = token(email, "User@123");
        mvc.perform(post("/api/v1/payments/sepay/create").header("Authorization", "Bearer " + other).contentType(MediaType.APPLICATION_JSON).content("{\"orderId\":" + f.order + "}")).andExpect(status().is4xxClientError());
        mvc.perform(get("/api/v1/orders/" + f.order + "/payment-status").header("Authorization", "Bearer " + other)).andExpect(status().is4xxClientError());
        mvc.perform(get("/api/v1/payments/reference/" + a.path("transactionReference").asText()).header("Authorization", "Bearer " + other)).andExpect(status().is4xxClientError());
        mvc.perform(get("/api/v1/admin/payments").header("Authorization", "Bearer " + f.token)).andExpect(status().isForbidden());
    }
    @Test void nearExpiryCannotCreatePayment() throws Exception {
        Fixture f = fixture(); db.update("UPDATE orders SET payment_expires_at=now()+interval '30 seconds' WHERE id=?", f.order);
        mvc.perform(post("/api/v1/payments/sepay/create").header("Authorization", "Bearer " + f.token).contentType(MediaType.APPLICATION_JSON).content("{\"orderId\":" + f.order + "}")).andExpect(status().is4xxClientError());
        assertThat(count("payment_transactions", f)).isZero();
    }
    @Test void lateNotificationWithInsufficientStockRequiresReview() throws Exception {
        Fixture f = fixture(); var p = notification(f, create(f));
        db.update("UPDATE orders SET order_status='EXPIRED',payment_expires_at=now()-interval '1 minute' WHERE id=?", f.order);
        db.update("UPDATE stock_reservations SET status='EXPIRED',expires_at=now()-interval '1 minute' WHERE order_id=?", f.order);
        db.update("UPDATE ingredients SET current_stock=1 WHERE id=?", f.ingredient); ipn(p);
        assertThat(db.queryForObject("SELECT payment_status FROM orders WHERE id=?", String.class, f.order)).isEqualTo("PAYMENT_REVIEW");
        assertThat(db.queryForObject("SELECT status FROM payment_transactions WHERE order_id=?", String.class, f.order)).isEqualTo("REVIEW_REQUIRED");
        assertThat(stock(f)).isEqualByComparingTo("1"); assertThat(count("order_ingredient_consumptions", f)).isZero();
    }
    @Test void fulfillmentRequiresPaymentAndOnlyAllowsForwardSteps() throws Exception {
        Fixture f = fixture(); String admin = token("admin@banquethub.vn", "Admin@123"); String employee = token("employee@banquethub.vn", "Employee@123");
        mvc.perform(patch("/api/v1/admin/orders/" + f.order + "/status").header("Authorization", "Bearer " + admin).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"PAID\"}")).andExpect(status().is4xxClientError());
        mvc.perform(patch("/api/v1/admin/orders/" + f.order + "/status").header("Authorization", "Bearer " + f.token).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"PREPARING\"}")).andExpect(status().isForbidden());
        ipn(notification(f, create(f)));
        body(mvc.perform(patch("/api/v1/admin/orders/" + f.order + "/status").header("Authorization", "Bearer " + admin).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"PREPARING\"}")));
        body(mvc.perform(patch("/api/v1/employee/orders/" + f.order + "/status").header("Authorization", "Bearer " + employee).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"COMPLETED\"}")));
        assertThat(orderStatus(f)).isEqualTo("COMPLETED");
        mvc.perform(patch("/api/v1/admin/orders/" + f.order + "/status").header("Authorization", "Bearer " + admin).contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"PREPARING\"}")).andExpect(status().is4xxClientError());
    }

    @Test void adminCanRetryVerifiedPaymentAfterStockIsRestored() throws Exception {
        Fixture f = fixture();
        JsonNode attempt = create(f);
        var fields = notification(f, attempt);
        db.update("UPDATE ingredients SET current_stock=1 WHERE id=?", f.ingredient);
        assertThat(ipn(fields).path("success").asBoolean()).isTrue();
        long id = attempt.path("paymentAttemptId").asLong();
        String admin = token("admin@banquethub.vn", "Admin@123");
        resolve(id, f.token, "RETRY_SETTLEMENT").andExpect(status().isForbidden());
        resolve(id, admin, "RETRY_SETTLEMENT").andExpect(status().isBadRequest());
        db.update("UPDATE ingredients SET current_stock=100 WHERE id=?", f.ingredient);
        assertThat(ipn(fields).path("success").asBoolean()).isTrue();
        resolve(id, admin, "RETRY_SETTLEMENT").andExpect(status().isOk());
        settled(f);
        assertThat(count("email_outbox", f)).isEqualTo(1);
        resolve(id, admin, "RETRY_SETTLEMENT").andExpect(status().isBadRequest());
        assertThat(db.queryForObject("SELECT count(*) FROM order_status_histories WHERE order_id=? AND changed_by IS NOT NULL AND to_status='PAID'", Long.class, f.order)).isEqualTo(1);
    }

    @Test void capturedPaymentWithoutTimeRequiresReview() throws Exception {
        Fixture f = fixture();
        JsonNode attempt = create(f);
        var fields = notification(f, attempt);
        var transaction = fields.withObject("transaction");
        JsonNode date = transaction.remove("transaction_date");
        assertThat(ipn(fields).path("success").asBoolean()).isTrue();
        assertThat(stock(f)).isEqualByComparingTo("100");
        assertThat(db.queryForObject("SELECT payment_status FROM orders WHERE id=?", String.class, f.order)).isEqualTo("PAYMENT_REVIEW");

        transaction.set("transaction_date", date);
        ipn(fields);
        resolve(attempt.path("paymentAttemptId").asLong(), token("admin@banquethub.vn", "Admin@123"), "RETRY_SETTLEMENT")
            .andExpect(status().isOk());
        settled(f);
    }

    @Test void paymentCannotOutliveEventAndSchedulerExpiresAttempt() throws Exception {
        Fixture f = fixture();
        OffsetDateTime event = OffsetDateTime.now().plusMinutes(5).withNano(0);
        db.update("UPDATE orders SET event_date_time=? WHERE id=?", event, f.order);
        JsonNode attempt = create(f);
        assertThat(OffsetDateTime.parse(attempt.path("expiresAt").asText()).toInstant()).isEqualTo(event.toInstant());
        db.update("UPDATE orders SET payment_expires_at=now()-interval '1 second' WHERE id=?", f.order);
        expiryScheduler.cleanupExpiredReservations();
        assertThat(db.queryForObject("SELECT status FROM payment_transactions WHERE order_id=?",String.class,f.order)).isEqualTo("EXPIRED");
    }

    @Test void migrationRepairsQueuedEmailAndKeepsReviewEvidencePrivate() throws Exception {
        Fixture f = fixture();
        JsonNode attempt = create(f);
        long id = attempt.path("paymentAttemptId").asLong();
        db.update("UPDATE payment_transactions SET status='REVIEW_CLOSED', failure_reason='Đã xử lý thủ công: INTERNAL-123' WHERE id=?", id);
        db.update("INSERT INTO order_status_histories(order_id,to_status,changed_by_name,reason) VALUES (?,'PENDING_PAYMENT','ADMIN','Đóng đối soát: INTERNAL-123')", f.order);
        db.update("INSERT INTO email_outbox(order_id,event_type,recipient,subject,html_body,status) VALUES (?,'PAYMENT_CONFIRMED','test@example.test','Test',?,'FAILED')",
            f.order, "<a href=\"https://banquethub.test/orders/" + f.order + "\">Xem đơn</a>");
        db.update("INSERT INTO payment_notification_logs(transaction_reference,source,result_code,detail) VALUES (?,'ADMIN','CLOSE_MANUALLY','INTERNAL-123')",
            attempt.path("transactionReference").asText());

        var migration = new org.springframework.core.io.ClassPathResource("db/migration/V12__repair_payment_notifications.sql");
        db.execute(migration.getContentAsString(StandardCharsets.UTF_8));
        assertThat(db.queryForObject("SELECT html_body FROM email_outbox WHERE order_id=?", String.class, f.order))
            .contains("/my-orders/" + f.order);
        JsonNode paymentStatus = body(mvc.perform(get("/api/v1/orders/{id}/payment-status", f.order)
            .header("Authorization", "Bearer " + f.token)));
        assertThat(paymentStatus.toString()).doesNotContain("INTERNAL-123");
        assertThat(db.queryForObject("SELECT detail FROM payment_notification_logs WHERE transaction_reference=?",
            String.class, attempt.path("transactionReference").asText())).isEqualTo("INTERNAL-123");
    }

    private org.springframework.test.web.servlet.ResultActions resolve(long id, String token, String action) throws Exception {
        return mvc.perform(post("/api/v1/admin/payments/{id}/resolve", id)
            .header("Authorization","Bearer "+token).contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("action", action, "reason", "Đã kiểm tra với SePay", "resolutionReference", "CASE-001"))));
    }
}
