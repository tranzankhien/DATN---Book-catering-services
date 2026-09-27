package com.banquethub.modules.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class StockReceiptCreateRequest {

    @NotNull(message = "Nhà cung cấp không được để trống")
    private Long supplierId;

    private LocalDate receiptDate;

    @DecimalMin(value = "0.0", inclusive = true, message = "Số tiền thanh toán không được âm")
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Size(max = 500, message = "Ghi chú thanh toán không vượt quá 500 ký tự")
    private String paymentNote;

    @Size(max = 1000, message = "Ghi chú phiếu nhập không vượt quá 1000 ký tự")
    private String note;

    private Boolean confirmImmediately = false;

    @NotEmpty(message = "Phiếu nhập phải có ít nhất 01 dòng nguyên liệu")
    @Valid
    private List<@NotNull(message = "Dòng nguyên liệu không được để trống") StockReceiptItemRequest> items;

    public StockReceiptCreateRequest() {
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public LocalDate getReceiptDate() {
        return receiptDate;
    }

    public void setReceiptDate(LocalDate receiptDate) {
        this.receiptDate = receiptDate;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
    }

    public String getPaymentNote() {
        return paymentNote;
    }

    public void setPaymentNote(String paymentNote) {
        this.paymentNote = paymentNote;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public Boolean getConfirmImmediately() {
        return confirmImmediately;
    }

    public void setConfirmImmediately(Boolean confirmImmediately) {
        this.confirmImmediately = confirmImmediately;
    }

    public List<StockReceiptItemRequest> getItems() {
        return items;
    }

    public void setItems(List<StockReceiptItemRequest> items) {
        this.items = items;
    }
}
