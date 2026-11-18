package com.banquethub.modules.reports.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ProfitReportResponse {

    // Công thức MVP chuẩn
    private BigDecimal paidRevenue = BigDecimal.ZERO;           // A: Doanh thu đã thanh toán
    private BigDecimal materialCost = BigDecimal.ZERO;          // B: Giá vốn nguyên liệu tiêu hao
    private BigDecimal grossProfit = BigDecimal.ZERO;           // A - B: Lợi nhuận gộp
    private Double grossMargin = 0.0;                           // (A - B) / A * 100

    private BigDecimal internalPayrollCost = BigDecimal.ZERO;   // C: Chi phí lương nội bộ đã chốt
    private BigDecimal operatingExpenses = BigDecimal.ZERO;     // D: Chi phí vận hành khác
    private BigDecimal totalExpenses = BigDecimal.ZERO;         // B + C + D: Tổng chi phí tương ứng
    private BigDecimal estimatedProfit = BigDecimal.ZERO;       // A - B - C - D: Lợi nhuận ước tính
    private Double estimatedProfitMargin = 0.0;                 // (A - B - C - D) / A * 100

    // Bảng đối soát từng tháng
    private List<MonthlyProfitBreakdownDto> monthlyBreakdown = new ArrayList<>();

    public ProfitReportResponse() {}

    public BigDecimal getPaidRevenue() {
        return paidRevenue;
    }

    public void setPaidRevenue(BigDecimal paidRevenue) {
        this.paidRevenue = paidRevenue;
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

    public Double getGrossMargin() {
        return grossMargin;
    }

    public void setGrossMargin(Double grossMargin) {
        this.grossMargin = grossMargin;
    }

    public BigDecimal getInternalPayrollCost() {
        return internalPayrollCost;
    }

    public void setInternalPayrollCost(BigDecimal internalPayrollCost) {
        this.internalPayrollCost = internalPayrollCost;
    }

    public BigDecimal getOperatingExpenses() {
        return operatingExpenses;
    }

    public void setOperatingExpenses(BigDecimal operatingExpenses) {
        this.operatingExpenses = operatingExpenses;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public void setTotalExpenses(BigDecimal totalExpenses) {
        this.totalExpenses = totalExpenses;
    }

    public BigDecimal getEstimatedProfit() {
        return estimatedProfit;
    }

    public void setEstimatedProfit(BigDecimal estimatedProfit) {
        this.estimatedProfit = estimatedProfit;
    }

    public Double getEstimatedProfitMargin() {
        return estimatedProfitMargin;
    }

    public void setEstimatedProfitMargin(Double estimatedProfitMargin) {
        this.estimatedProfitMargin = estimatedProfitMargin;
    }

    public List<MonthlyProfitBreakdownDto> getMonthlyBreakdown() {
        return monthlyBreakdown;
    }

    public void setMonthlyBreakdown(List<MonthlyProfitBreakdownDto> monthlyBreakdown) {
        this.monthlyBreakdown = monthlyBreakdown;
    }
}
