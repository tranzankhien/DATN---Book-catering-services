package com.banquethub.modules.payments.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.modules.payments.config.SePayConfig;
import com.banquethub.modules.payments.dto.PaymentView;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Service
public class SePayQueryService {
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final SePayConfig config;
    private final PaymentService payments;
    private final PaymentAuditService audit;
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public SePayQueryService(SePayConfig config, PaymentService payments, PaymentAuditService audit,
                             JdbcTemplate jdbc, ObjectMapper json) {
        this.config=config;
        this.payments=payments;
        this.audit=audit;
        this.jdbc=jdbc;
        this.json=json;
    }

    public PaymentView query(Long id) {
        config.requireConfigured();
        PaymentView payment = payments.detail(id);
        String reference = payment.transactionReference();
        if (!reference.matches("[A-Za-z0-9]{1,64}")) throw new BusinessValidationException("Mã hóa đơn không hợp lệ.");
        int changed = jdbc.update("""
            UPDATE payment_transactions SET last_queried_at=now(), query_count=query_count+1
            WHERE id=? AND provider='SEPAY' AND (last_queried_at IS NULL OR last_queried_at<now()-interval '30 seconds')
            """, id);
        if (changed==0) throw new BusinessValidationException("Chỉ truy vấn giao dịch SePay, cách nhau ít nhất 30 giây.");
        String auth = Base64.getEncoder().encodeToString((config.merchantId+":"+config.secretKey).getBytes(StandardCharsets.UTF_8));
        try {
            var request = HttpRequest.newBuilder(URI.create(SePayConfig.API_URL+"/v1/order/detail/"+reference))
                .timeout(Duration.ofSeconds(12)).header("Authorization","Basic "+auth).GET().build();
            var response = client.send(request,HttpResponse.BodyHandlers.ofString());
            if (response.statusCode()!=200) throw new BusinessValidationException("SePay chưa trả chi tiết hóa đơn (HTTP "+response.statusCode()+").");
            var order = json.readTree(response.body()).path("data");
            if (!reference.equals(order.path("order_invoice_number").asText()))
                throw new BusinessValidationException("Mã hóa đơn phản hồi SePay không khớp.");
            for (var transaction : order.path("transactions")) {
                if ("CAPTURED".equals(order.path("order_status").asText()) &&
                        "PAYMENT".equals(transaction.path("transaction_type").asText()) &&
                        "APPROVED".equals(transaction.path("transaction_status").asText())) {
                    payments.applyCaptured(order, transaction);
                    audit.record(reference, "SEPAY_QUERY", "CAPTURED", "SePay transaction verified");
                    return payments.detail(id);
                }
            }
            throw new BusinessValidationException("SePay chưa xác nhận thanh toán thành công cho hóa đơn này.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessValidationException("Truy vấn SePay bị gián đoạn.");
        } catch (java.io.IOException e) {
            throw new BusinessValidationException("Không đọc được kết quả truy vấn SePay.");
        }
    }
}
