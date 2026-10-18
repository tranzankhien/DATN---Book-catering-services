package com.banquethub.modules.notifications.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.notifications.dto.NotificationResponse;
import com.banquethub.modules.orders.entity.Order;
import com.banquethub.modules.orders.entity.PaymentStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class EmailOutboxService {
    private final JdbcTemplate jdbc;
    private final String websiteUrl;
    private final int maxAttempts;
    private static final RowMapper<NotificationResponse> VIEW = (rs,n) -> new NotificationResponse(
            rs.getLong("id"), rs.getLong("order_id"), rs.getString("event_type"), rs.getString("status"),
            rs.getInt("attempts"), rs.getString("last_error"), rs.getObject("created_at", OffsetDateTime.class),
            rs.getObject("sent_at", OffsetDateTime.class));
    public record Claim(long id, String token, String recipient, String subject, String html, int attempts) {}

    public EmailOutboxService(JdbcTemplate jdbc, @Value("${app.email.website-url:http://localhost:5173}") String websiteUrl,
            @Value("${app.email.max-attempts:5}") int maxAttempts) {
        this.jdbc=jdbc; this.websiteUrl=EmailTemplate.validateWebsiteUrl(websiteUrl); this.maxAttempts=Math.max(1, maxAttempts);
    }

    // Must join the settlement/fulfillment transaction: never persist an independent success email.
    @Transactional(propagation=Propagation.MANDATORY)
    public void enqueue(Order order, String eventType) {
        if (order.getPaymentStatus() != PaymentStatus.PAID) throw new IllegalStateException("Email requires verified payment");
        String title = EmailTemplate.title(eventType);
        jdbc.update("INSERT INTO email_outbox(order_id,event_type,recipient,subject,html_body) VALUES (?,?,?,?,?) ON CONFLICT(order_id,event_type) DO NOTHING",
                order.getId(), eventType, order.getCustomerEmail(), "[BanquetHub] " + title + " – " + order.getOrderCode(),
                EmailTemplate.render(order,eventType,websiteUrl));
    }

    @Transactional
    public Optional<Claim> claim() {
        // Crashes on the last attempt also become terminal; older claims cannot acknowledge a new lease.
        jdbc.update("UPDATE email_outbox SET status='FAILED',claim_token=NULL,lease_until=NULL,last_error='Delivery lease expired; delivery outcome unknown' WHERE status='PROCESSING' AND lease_until < CURRENT_TIMESTAMP AND attempts >= ?", maxAttempts);
        String token=UUID.randomUUID().toString();
        var rows=jdbc.query("""
                UPDATE email_outbox SET status='PROCESSING', attempts=attempts+1, claim_token=?,
                    lease_until=CURRENT_TIMESTAMP + INTERVAL '5 minutes'
                WHERE id=(SELECT id FROM email_outbox WHERE attempts < ? AND
                    ((status='PENDING' AND next_attempt_at <= CURRENT_TIMESTAMP) OR
                     (status='PROCESSING' AND lease_until < CURRENT_TIMESTAMP))
                    ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1)
                RETURNING id,recipient,subject,html_body,attempts
                """, (rs,n) -> new Claim(rs.getLong("id"),token,rs.getString("recipient"),rs.getString("subject"),rs.getString("html_body"),rs.getInt("attempts")), token,maxAttempts);
        return rows.stream().findFirst();
    }

    @Transactional
    public void sent(Claim claim) {
        jdbc.update("UPDATE email_outbox SET status='SENT',sent_at=CURRENT_TIMESTAMP,last_error=NULL,claim_token=NULL,lease_until=NULL WHERE id=? AND claim_token=? AND status='PROCESSING'",claim.id(),claim.token());
    }
    @Transactional
    public void failed(Claim claim) {
        // Do not store exception messages: SMTP exceptions can contain credentials or recipient data.
        jdbc.update("UPDATE email_outbox SET status=?,last_error='SMTP delivery failed; check server mail configuration',next_attempt_at=CURRENT_TIMESTAMP + (? * INTERVAL '1 second'),claim_token=NULL,lease_until=NULL WHERE id=? AND claim_token=? AND status='PROCESSING'",
                claim.attempts() >= maxAttempts ? "FAILED" : "PENDING", Math.min(3600,30 * (1 << Math.min(claim.attempts(),6))),claim.id(),claim.token());
    }
    @Transactional(readOnly=true)
    public Page<NotificationResponse> list(String status, Pageable page) {
        if (status != null && !Set.of("PENDING","PROCESSING","SENT","FAILED").contains(status)) throw new BusinessValidationException("Trạng thái email không hợp lệ.");
        String where=status == null ? "" : " WHERE status=?";
        List<Object> params=new ArrayList<>(); if(status != null) params.add(status);
        long total=Objects.requireNonNull(jdbc.queryForObject("SELECT count(*) FROM email_outbox"+where,Long.class,params.toArray()));
        params.add(page.getPageSize()); params.add(page.getOffset());
        return new PageImpl<>(jdbc.query("SELECT * FROM email_outbox"+where+" ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?",VIEW,params.toArray()),page,total);
    }
    @Transactional
    public NotificationResponse retry(long id) {
        var rows=jdbc.query("SELECT * FROM email_outbox WHERE id=? FOR UPDATE",VIEW,id);
        if(rows.isEmpty()) throw new ResourceNotFoundException("Không tìm thấy thông báo email.");
        if(!rows.getFirst().status().equals("FAILED")) throw new BusinessValidationException("Chỉ có thể gửi lại email đã thất bại.");
        jdbc.update("UPDATE email_outbox SET status='PENDING',attempts=0,last_error=NULL,next_attempt_at=CURRENT_TIMESTAMP,claim_token=NULL,lease_until=NULL WHERE id=?",id);
        return jdbc.queryForObject("SELECT * FROM email_outbox WHERE id=?",VIEW,id);
    }
}
