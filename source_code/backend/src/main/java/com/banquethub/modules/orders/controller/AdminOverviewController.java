package com.banquethub.modules.orders.controller;

import com.banquethub.common.dto.ApiResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@PreAuthorize("hasRole('ADMIN')")
public class AdminOverviewController {
    private final JdbcTemplate jdbc;

    public AdminOverviewController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record Counts(long pendingPayment, long paid, long preparing, long completed,
                         long paymentReview, long failedEmails) {}

    @GetMapping("/api/v1/admin/overview")
    public ApiResponse<Counts> overview() {
        Counts counts = jdbc.queryForObject("""
            SELECT
                count(*) FILTER (WHERE order_status='PENDING_PAYMENT' AND payment_status='UNPAID'
                    AND payment_expires_at > now()) AS pending_payment,
                count(*) FILTER (WHERE order_status='PAID') AS paid,
                count(*) FILTER (WHERE order_status='PREPARING') AS preparing,
                count(*) FILTER (WHERE order_status='COMPLETED') AS completed,
                (SELECT count(*) FROM payment_transactions WHERE status='REVIEW_REQUIRED') AS payment_review,
                (SELECT count(*) FROM email_outbox WHERE status='FAILED') AS failed_emails
            FROM orders
            """, (rs, row) -> new Counts(rs.getLong("pending_payment"), rs.getLong("paid"),
                rs.getLong("preparing"), rs.getLong("completed"), rs.getLong("payment_review"),
                rs.getLong("failed_emails")));
        return ApiResponse.ok("Tổng quan vận hành", counts);
    }
}
