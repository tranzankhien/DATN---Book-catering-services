package com.banquethub.modules.expenses.dto;

import java.math.BigDecimal;

public class ExpenseSummaryResponse {

    private BigDecimal totalExpenses = BigDecimal.ZERO;
    private BigDecimal totalPaid = BigDecimal.ZERO;
    private BigDecimal totalUnpaid = BigDecimal.ZERO;
    private Long totalCount = 0L;

    public ExpenseSummaryResponse() {}

    public ExpenseSummaryResponse(BigDecimal totalExpenses, BigDecimal totalPaid, BigDecimal totalUnpaid, Long totalCount) {
        this.totalExpenses = totalExpenses != null ? totalExpenses : BigDecimal.ZERO;
        this.totalPaid = totalPaid != null ? totalPaid : BigDecimal.ZERO;
        this.totalUnpaid = totalUnpaid != null ? totalUnpaid : BigDecimal.ZERO;
        this.totalCount = totalCount != null ? totalCount : 0L;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public void setTotalExpenses(BigDecimal totalExpenses) {
        this.totalExpenses = totalExpenses;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
    }

    public BigDecimal getTotalUnpaid() {
        return totalUnpaid;
    }

    public void setTotalUnpaid(BigDecimal totalUnpaid) {
        this.totalUnpaid = totalUnpaid;
    }

    public Long getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(Long totalCount) {
        this.totalCount = totalCount;
    }
}
