package com.banquethub.modules.reports.dto;

import java.math.BigDecimal;

public class RevenueSummaryResponse {

    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private Long paidOrdersCount = 0L;
    private BigDecimal averageOrderValue = BigDecimal.ZERO;
    private Long totalTablesServed = 0L;

    public RevenueSummaryResponse() {}

    public RevenueSummaryResponse(BigDecimal totalRevenue, Long paidOrdersCount, BigDecimal averageOrderValue, Long totalTablesServed) {
        this.totalRevenue = totalRevenue != null ? totalRevenue : BigDecimal.ZERO;
        this.paidOrdersCount = paidOrdersCount != null ? paidOrdersCount : 0L;
        this.averageOrderValue = averageOrderValue != null ? averageOrderValue : BigDecimal.ZERO;
        this.totalTablesServed = totalTablesServed != null ? totalTablesServed : 0L;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public Long getPaidOrdersCount() {
        return paidOrdersCount;
    }

    public void setPaidOrdersCount(Long paidOrdersCount) {
        this.paidOrdersCount = paidOrdersCount;
    }

    public BigDecimal getAverageOrderValue() {
        return averageOrderValue;
    }

    public void setAverageOrderValue(BigDecimal averageOrderValue) {
        this.averageOrderValue = averageOrderValue;
    }

    public Long getTotalTablesServed() {
        return totalTablesServed;
    }

    public void setTotalTablesServed(Long totalTablesServed) {
        this.totalTablesServed = totalTablesServed;
    }
}
