package com.banquethub.modules.reports.dto;

import java.math.BigDecimal;
import java.util.List;

public class InventoryReportResponse {

    private Long totalIngredientsCount = 0L;
    private BigDecimal estimatedInventoryValuation = BigDecimal.ZERO;
    private BigDecimal confirmedPurchasesAmount = BigDecimal.ZERO;
    private BigDecimal totalConsumedCost = BigDecimal.ZERO;
    private Long lowStockCount = 0L;

    public InventoryReportResponse() {}

    public Long getTotalIngredientsCount() {
        return totalIngredientsCount;
    }

    public void setTotalIngredientsCount(Long totalIngredientsCount) {
        this.totalIngredientsCount = totalIngredientsCount;
    }

    public BigDecimal getEstimatedInventoryValuation() {
        return estimatedInventoryValuation;
    }

    public void setEstimatedInventoryValuation(BigDecimal estimatedInventoryValuation) {
        this.estimatedInventoryValuation = estimatedInventoryValuation;
    }

    public BigDecimal getConfirmedPurchasesAmount() {
        return confirmedPurchasesAmount;
    }

    public void setConfirmedPurchasesAmount(BigDecimal confirmedPurchasesAmount) {
        this.confirmedPurchasesAmount = confirmedPurchasesAmount;
    }

    public BigDecimal getTotalConsumedCost() {
        return totalConsumedCost;
    }

    public void setTotalConsumedCost(BigDecimal totalConsumedCost) {
        this.totalConsumedCost = totalConsumedCost;
    }

    public Long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(Long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }
}
