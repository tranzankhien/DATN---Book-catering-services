package com.banquethub.modules.inventory.dto;

import com.banquethub.modules.inventory.entity.PaymentStatus;
import com.banquethub.modules.inventory.entity.StockReceipt;
import com.banquethub.modules.inventory.entity.StockReceiptStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class StockReceiptResponse {

    private Long id;
    private String code;
    private Long supplierId;
    private String supplierCode;
    private String supplierName;
    private String supplierPhone;
    private String supplierAddress;
    private LocalDate receiptDate;
    private StockReceiptStatus status;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal remainingAmount;
    private PaymentStatus paymentStatus;
    private OffsetDateTime lastPaidAt;
    private String paymentNote;
    private String note;
    private String createdByName;
    private OffsetDateTime confirmedAt;
    private String confirmedByName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<StockReceiptItemResponse> items = new ArrayList<>();

    public StockReceiptResponse() {
    }

    public static StockReceiptResponse fromEntity(StockReceipt receipt) {
        return fromEntity(receipt, true);
    }

    public static StockReceiptResponse fromEntity(StockReceipt receipt, boolean includeItems) {
        StockReceiptResponse dto = new StockReceiptResponse();
        dto.setId(receipt.getId());
        dto.setCode(receipt.getCode());
        dto.setReceiptDate(receipt.getReceiptDate());
        dto.setStatus(receipt.getStatus());
        dto.setTotalAmount(receipt.getTotalAmount());
        dto.setAmountPaid(receipt.getAmountPaid());
        dto.setRemainingAmount(receipt.getRemainingAmount());
        dto.setPaymentStatus(receipt.getPaymentStatus());
        dto.setLastPaidAt(receipt.getLastPaidAt());
        dto.setPaymentNote(receipt.getPaymentNote());
        dto.setNote(receipt.getNote());
        dto.setCreatedByName(receipt.getCreatedByName());
        dto.setConfirmedAt(receipt.getConfirmedAt());
        dto.setConfirmedByName(receipt.getConfirmedByName());
        dto.setCreatedAt(receipt.getCreatedAt());
        dto.setUpdatedAt(receipt.getUpdatedAt());

        if (receipt.getSupplier() != null) {
            dto.setSupplierId(receipt.getSupplier().getId());
            dto.setSupplierCode(receipt.getSupplier().getCode());
            dto.setSupplierName(receipt.getSupplier().getName());
            dto.setSupplierPhone(receipt.getSupplier().getPhone());
            dto.setSupplierAddress(receipt.getSupplier().getAddress());
        }

        if (includeItems && receipt.getItems() != null) {
            dto.setItems(receipt.getItems().stream()
                    .map(StockReceiptItemResponse::fromEntity)
                    .toList());
        }

        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierCode() {
        return supplierCode;
    }

    public void setSupplierCode(String supplierCode) {
        this.supplierCode = supplierCode;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getSupplierPhone() {
        return supplierPhone;
    }

    public void setSupplierPhone(String supplierPhone) {
        this.supplierPhone = supplierPhone;
    }

    public String getSupplierAddress() {
        return supplierAddress;
    }

    public void setSupplierAddress(String supplierAddress) {
        this.supplierAddress = supplierAddress;
    }

    public LocalDate getReceiptDate() {
        return receiptDate;
    }

    public void setReceiptDate(LocalDate receiptDate) {
        this.receiptDate = receiptDate;
    }

    public StockReceiptStatus getStatus() {
        return status;
    }

    public void setStatus(StockReceiptStatus status) {
        this.status = status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
    }

    public BigDecimal getRemainingAmount() {
        return remainingAmount;
    }

    public void setRemainingAmount(BigDecimal remainingAmount) {
        this.remainingAmount = remainingAmount;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public OffsetDateTime getLastPaidAt() {
        return lastPaidAt;
    }

    public void setLastPaidAt(OffsetDateTime lastPaidAt) {
        this.lastPaidAt = lastPaidAt;
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

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }

    public OffsetDateTime getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(OffsetDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public String getConfirmedByName() {
        return confirmedByName;
    }

    public void setConfirmedByName(String confirmedByName) {
        this.confirmedByName = confirmedByName;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<StockReceiptItemResponse> getItems() {
        return items;
    }

    public void setItems(List<StockReceiptItemResponse> items) {
        this.items = items;
    }
}
