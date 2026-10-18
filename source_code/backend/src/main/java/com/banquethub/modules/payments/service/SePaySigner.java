package com.banquethub.modules.payments.service;

import org.springframework.stereotype.Component;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class SePaySigner {
    private static final List<String> FIELDS = List.of(
        "operation",
        "payment_method",
        "order_invoice_number",
        "order_amount",
        "currency",
        "order_description",
        "customer_id",
        "success_url",
        "error_url",
        "cancel_url",
        "merchant"
    );

    public String sign(String secret, Map<String, String> fields) {
        String data = FIELDS.stream().filter(key -> {
            String value = fields.get(key);
            return value != null && !value.isEmpty() && !"0".equals(value);
        }).map(key -> key + "=" + fields.get(key)).collect(Collectors.joining(","));
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException error) {
            throw new IllegalStateException("Cannot sign checkout", error);
        }
    }
}
