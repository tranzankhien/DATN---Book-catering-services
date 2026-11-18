package com.banquethub.modules.reports.dto;

import java.math.BigDecimal;

public class SupplierPurchaseDto {

    private Long supplierId;
    private String supplierName;
    private String supplierPhone;
    private Long confirmedReceiptsCount = 0L;
    private BigDecimal totalPurchasedAmount = BigDecimal.ZERO;
    private BigDecimal totalPaidAmount = BigDecimal.ZERO;
    private BigDecimal outstandingDebt = BigDecimal.ZERO;

    public SupplierPurchaseDto() {}

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
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

    public Long getConfirmedReceiptsCount() {
        return confirmedReceiptsCount;
    }

    public void setConfirmedReceiptsCount(Long confirmedReceiptsCount) {
        this.confirmedReceiptsCount = confirmedReceiptsCount;
    }

    public BigDecimal getTotalPurchasedAmount() {
        return totalPurchasedAmount;
    }

    public void setTotalPurchasedAmount(BigDecimal totalPurchasedAmount) {
        this.totalPurchasedAmount = totalPurchasedAmount;
    }

    public BigDecimal getTotalPaidAmount() {
        return totalPaidAmount;
    }

    public void setTotalPaidAmount(BigDecimal totalPaidAmount) {
        this.totalPaidAmount = totalPaidAmount;
    }

    public BigDecimal getOutstandingDebt() {
        return outstandingDebt;
    }

    public void setOutstandingDebt(BigDecimal outstandingDebt) {
        this.outstandingDebt = outstandingDebt;
    }
}
