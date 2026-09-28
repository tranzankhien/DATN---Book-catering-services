package com.banquethub.modules.inventory.dto;

import com.banquethub.modules.catalog.dto.IngredientResponse;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class InventorySummaryResponse {

    private long totalIngredients;
    private long lowStockCount;
    private BigDecimal estimatedStockValue = BigDecimal.ZERO;
    private BigDecimal monthlyPurchasedAmount = BigDecimal.ZERO;
    private BigDecimal totalPurchasedAmount = BigDecimal.ZERO;
    private BigDecimal totalPaidToSuppliers = BigDecimal.ZERO;
    private BigDecimal totalRemainingToSuppliers = BigDecimal.ZERO;
    private List<IngredientResponse> lowStockIngredients = new ArrayList<>();
    private List<StockReceiptResponse> recentReceipts = new ArrayList<>();
    private List<StockMovementResponse> recentMovements = new ArrayList<>();

    public InventorySummaryResponse() {
    }

    public long getTotalIngredients() {
        return totalIngredients;
    }

    public void setTotalIngredients(long totalIngredients) {
        this.totalIngredients = totalIngredients;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public BigDecimal getEstimatedStockValue() {
        return estimatedStockValue;
    }

    public void setEstimatedStockValue(BigDecimal estimatedStockValue) {
        this.estimatedStockValue = estimatedStockValue;
    }

    public BigDecimal getMonthlyPurchasedAmount() {
        return monthlyPurchasedAmount;
    }

    public void setMonthlyPurchasedAmount(BigDecimal monthlyPurchasedAmount) {
        this.monthlyPurchasedAmount = monthlyPurchasedAmount;
    }

    public BigDecimal getTotalPurchasedAmount() {
        return totalPurchasedAmount;
    }

    public void setTotalPurchasedAmount(BigDecimal totalPurchasedAmount) {
        this.totalPurchasedAmount = totalPurchasedAmount;
    }

    public BigDecimal getTotalPaidToSuppliers() {
        return totalPaidToSuppliers;
    }

    public void setTotalPaidToSuppliers(BigDecimal totalPaidToSuppliers) {
        this.totalPaidToSuppliers = totalPaidToSuppliers;
    }

    public BigDecimal getTotalRemainingToSuppliers() {
        return totalRemainingToSuppliers;
    }

    public void setTotalRemainingToSuppliers(BigDecimal totalRemainingToSuppliers) {
        this.totalRemainingToSuppliers = totalRemainingToSuppliers;
    }

    public List<IngredientResponse> getLowStockIngredients() {
        return lowStockIngredients;
    }

    public void setLowStockIngredients(List<IngredientResponse> lowStockIngredients) {
        this.lowStockIngredients = lowStockIngredients;
    }

    public List<StockReceiptResponse> getRecentReceipts() {
        return recentReceipts;
    }

    public void setRecentReceipts(List<StockReceiptResponse> recentReceipts) {
        this.recentReceipts = recentReceipts;
    }

    public List<StockMovementResponse> getRecentMovements() {
        return recentMovements;
    }

    public void setRecentMovements(List<StockMovementResponse> recentMovements) {
        this.recentMovements = recentMovements;
    }
}

