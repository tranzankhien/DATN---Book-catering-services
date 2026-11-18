package com.banquethub.modules.reports.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardOverviewResponse {

    // 8 Thẻ KPI chính
    private BigDecimal paidRevenue = BigDecimal.ZERO;
    private Long paidOrdersCount = 0L;
    private Long preparingOrdersCount = 0L;
    private Long completedOrdersCount = 0L;
    private BigDecimal materialCost = BigDecimal.ZERO;
    private BigDecimal grossProfit = BigDecimal.ZERO;
    private BigDecimal internalPayrollCost = BigDecimal.ZERO;
    private BigDecimal estimatedProfit = BigDecimal.ZERO;

    // Chỉ số bổ trợ
    private BigDecimal grossProfitMargin = BigDecimal.ZERO;
    private BigDecimal estimatedProfitMargin = BigDecimal.ZERO;
    private Long lowStockIngredientsCount = 0L;
    private BigDecimal estimatedInventoryValuation = BigDecimal.ZERO;
    private Long activeEmployeesCount = 0L;
    private BigDecimal otherOperatingExpenses = BigDecimal.ZERO;

    // So sánh kỳ trước (tùy chọn)
    private Double revenueGrowthPercent;
    private Double orderGrowthPercent;

    public DashboardOverviewResponse() {}

    // Getters and Setters
    public BigDecimal getPaidRevenue() {
        return paidRevenue;
    }

    public void setPaidRevenue(BigDecimal paidRevenue) {
        this.paidRevenue = paidRevenue;
    }

    public Long getPaidOrdersCount() {
        return paidOrdersCount;
    }

    public void setPaidOrdersCount(Long paidOrdersCount) {
        this.paidOrdersCount = paidOrdersCount;
    }

    public Long getPreparingOrdersCount() {
        return preparingOrdersCount;
    }

    public void setPreparingOrdersCount(Long preparingOrdersCount) {
        this.preparingOrdersCount = preparingOrdersCount;
    }

    public Long getCompletedOrdersCount() {
        return completedOrdersCount;
    }

    public void setCompletedOrdersCount(Long completedOrdersCount) {
        this.completedOrdersCount = completedOrdersCount;
    }

    public BigDecimal getMaterialCost() {
        return materialCost;
    }

    public void setMaterialCost(BigDecimal materialCost) {
        this.materialCost = materialCost;
    }

    public BigDecimal getGrossProfit() {
        return grossProfit;
    }

    public void setGrossProfit(BigDecimal grossProfit) {
        this.grossProfit = grossProfit;
    }

    public BigDecimal getInternalPayrollCost() {
        return internalPayrollCost;
    }

    public void setInternalPayrollCost(BigDecimal internalPayrollCost) {
        this.internalPayrollCost = internalPayrollCost;
    }

    public BigDecimal getEstimatedProfit() {
        return estimatedProfit;
    }

    public void setEstimatedProfit(BigDecimal estimatedProfit) {
        this.estimatedProfit = estimatedProfit;
    }

    public BigDecimal getGrossProfitMargin() {
        return grossProfitMargin;
    }

    public void setGrossProfitMargin(BigDecimal grossProfitMargin) {
        this.grossProfitMargin = grossProfitMargin;
    }

    public BigDecimal getEstimatedProfitMargin() {
        return estimatedProfitMargin;
    }

    public void setEstimatedProfitMargin(BigDecimal estimatedProfitMargin) {
        this.estimatedProfitMargin = estimatedProfitMargin;
    }

    public Long getLowStockIngredientsCount() {
        return lowStockIngredientsCount;
    }

    public void setLowStockIngredientsCount(Long lowStockIngredientsCount) {
        this.lowStockIngredientsCount = lowStockIngredientsCount;
    }

    public BigDecimal getEstimatedInventoryValuation() {
        return estimatedInventoryValuation;
    }

    public void setEstimatedInventoryValuation(BigDecimal estimatedInventoryValuation) {
        this.estimatedInventoryValuation = estimatedInventoryValuation;
    }

    public Long getActiveEmployeesCount() {
        return activeEmployeesCount;
    }

    public void setActiveEmployeesCount(Long activeEmployeesCount) {
        this.activeEmployeesCount = activeEmployeesCount;
    }

    public BigDecimal getOtherOperatingExpenses() {
        return otherOperatingExpenses;
    }

    public void setOtherOperatingExpenses(BigDecimal otherOperatingExpenses) {
        this.otherOperatingExpenses = otherOperatingExpenses;
    }

    public Double getRevenueGrowthPercent() {
        return revenueGrowthPercent;
    }

    public void setRevenueGrowthPercent(Double revenueGrowthPercent) {
        this.revenueGrowthPercent = revenueGrowthPercent;
    }

    public Double getOrderGrowthPercent() {
        return orderGrowthPercent;
    }

    public void setOrderGrowthPercent(Double orderGrowthPercent) {
        this.orderGrowthPercent = orderGrowthPercent;
    }
}
