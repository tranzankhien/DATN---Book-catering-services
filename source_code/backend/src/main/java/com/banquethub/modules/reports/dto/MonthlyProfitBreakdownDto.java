package com.banquethub.modules.reports.dto;

import java.math.BigDecimal;

public class MonthlyProfitBreakdownDto {

    private String monthYear; // "Tháng 11/2026"
    private int year;
    private int month;
    private BigDecimal revenue = BigDecimal.ZERO;
    private BigDecimal materialCost = BigDecimal.ZERO;
    private BigDecimal grossProfit = BigDecimal.ZERO;
    private BigDecimal payrollCost = BigDecimal.ZERO;
    private BigDecimal operatingExpense = BigDecimal.ZERO;
    private BigDecimal estimatedProfit = BigDecimal.ZERO;

    public MonthlyProfitBreakdownDto() {}

    public MonthlyProfitBreakdownDto(String monthYear, int year, int month) {
        this.monthYear = monthYear;
        this.year = year;
        this.month = month;
    }

    public String getMonthYear() {
        return monthYear;
    }

    public void setMonthYear(String monthYear) {
        this.monthYear = monthYear;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
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

    public BigDecimal getPayrollCost() {
        return payrollCost;
    }

    public void setPayrollCost(BigDecimal payrollCost) {
        this.payrollCost = payrollCost;
    }

    public BigDecimal getOperatingExpense() {
        return operatingExpense;
    }

    public void setOperatingExpense(BigDecimal operatingExpense) {
        this.operatingExpense = operatingExpense;
    }

    public BigDecimal getEstimatedProfit() {
        return estimatedProfit;
    }

    public void setEstimatedProfit(BigDecimal estimatedProfit) {
        this.estimatedProfit = estimatedProfit;
    }
}
