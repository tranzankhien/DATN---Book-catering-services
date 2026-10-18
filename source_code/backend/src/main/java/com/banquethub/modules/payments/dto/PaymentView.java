package com.banquethub.modules.payments.dto;
import com.banquethub.modules.payments.entity.PaymentTransaction;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
public record PaymentView(Long id,Long orderId,String provider,String transactionReference,String providerTransactionNo,
    BigDecimal amount,String status,String bankCode,OffsetDateTime paidAt,OffsetDateTime expiresAt,String failureReason,OffsetDateTime createdAt) {
    public static PaymentView from(PaymentTransaction p) {
        return view(p, p.getFailureReason());
    }

    public static PaymentView forCustomer(PaymentTransaction p) {
        String reason = switch(p.getStatus()) {
            case "REVIEW_REQUIRED" -> "Giao dịch đang được đối soát.";
            case "REVIEW_CLOSED" -> "Đã đóng đối soát thanh toán.";
            case "FAILED" -> "Thanh toán không thành công.";
            default -> null;
        };
        return view(p, reason);
    }

    private static PaymentView view(PaymentTransaction p, String reason) {
        String status = "PENDING".equals(p.getStatus()) && !p.getExpiresAt().isAfter(OffsetDateTime.now())
            ? "EXPIRED" : p.getStatus();
        return new PaymentView(p.getId(),p.getOrder().getId(),p.getProvider(),p.getTransactionReference(),p.getProviderTransactionNo(),p.getAmount(),status,p.getBankCode(),p.getPaidAt(),p.getExpiresAt(),reason,p.getCreatedAt());
    }
}
