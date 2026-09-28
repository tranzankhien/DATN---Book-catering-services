package com.banquethub.modules.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class StockReceiptPaymentRequest {

    @NotNull(message = "Số tiền thanh toán bổ sung không được để trống")
    @DecimalMin(value = "1.0", inclusive = true, message = "Số tiền thanh toán phải lớn hơn 0 VND")
    private BigDecimal paymentAmount;

    @Size(max = 500, message = "Ghi chú thanh toán không vượt quá 500 ký tự")
    private String paymentNote;

    public StockReceiptPaymentRequest() {
    }

    public StockReceiptPaymentRequest(BigDecimal paymentAmount, String paymentNote) {
        this.paymentAmount = paymentAmount;
        this.paymentNote = paymentNote;
    }

    public BigDecimal getPaymentAmount() {
        return paymentAmount;
    }

    public void setPaymentAmount(BigDecimal paymentAmount) {
        this.paymentAmount = paymentAmount;
    }

    public String getPaymentNote() {
        return paymentNote;
    }

    public void setPaymentNote(String paymentNote) {
        this.paymentNote = paymentNote;
    }
}

