package com.banquethub.modules.payments.config;

import com.banquethub.common.exception.BusinessValidationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
public class SePayConfig {
    public static final String CHECKOUT_URL = "https://pay-sandbox.sepay.vn/v1/checkout/init";
    public static final String API_URL = "https://pgapi-sandbox.sepay.vn";

    @Value("${SEPAY_MERCHANT_ID:}") public String merchantId;
    @Value("${SEPAY_SECRET_KEY:}") public String secretKey;
    @Value("${SEPAY_IPN_SECRET:}") public String ipnSecret;
    @Value("${SEPAY_RETURN_URL:${APP_FRONTEND_URL:http://localhost:5173}/payment/result}") public String returnUrl;
    @Value("${SEPAY_MIN_REMAINING_SECONDS:120}") public long minRemainingSeconds;
    @Value("${SEPAY_MAX_AMOUNT:1000000000}") public BigDecimal maxAmount;

    public boolean isConfigured() {
        return !merchantId.isBlank() && !secretKey.isBlank() && !ipnSecret.isBlank();
    }

    public void requireConfigured() {
        if (!isConfigured())
            throw new BusinessValidationException("SePay Sandbox chưa được cấu hình đầy đủ.");
    }

    public void validateAmount(BigDecimal amount) {
        if (amount.signum() <= 0 || amount.compareTo(maxAmount) > 0 || amount.stripTrailingZeros().scale() > 0)
            throw new BusinessValidationException("Tổng tiền phải là số nguyên VND dương trong hạn mức thanh toán.");
    }
}
