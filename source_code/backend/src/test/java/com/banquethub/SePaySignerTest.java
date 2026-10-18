package com.banquethub;

import com.banquethub.modules.payments.service.SePaySigner;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;

class SePaySignerTest {
    @Test
    void signsDocumentedFieldOrderAsBase64HmacSha256() {
        var fields = Map.of("order_amount", "10000", "merchant", "TEST", "currency", "VND",
            "operation", "PURCHASE", "order_invoice_number", "DH123", "payment_method", "BANK_TRANSFER",
            "customer_id", "0", "unrecognized", "ignored");
        assertThat(new SePaySigner().sign("test-secret", fields))
            .isEqualTo("/JCm589zxKWKGljEDM265Yidj+/soTLDCjqiZkfndzI=");
    }
}
