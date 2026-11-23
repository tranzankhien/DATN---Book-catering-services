package com.banquethub.modules.reports.dto;

import java.math.BigDecimal;

public class PayrollReportResponse {

    private Long activeEmployeesCount = 0L;
    private Long finalizedPeriodsCount = 0L;
    private BigDecimal totalFinalizedNetSalary = BigDecimal.ZERO;
    private BigDecimal totalPaidSalary = BigDecimal.ZERO;
    private BigDecimal totalUnpaidSalary = BigDecimal.ZERO;
    private BigDecimal totalAllowances = BigDecimal.ZERO;
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    public PayrollReportResponse() {}

    public Long getActiveEmployeesCount() {
        return activeEmployeesCount;
    }

    public void setActiveEmployeesCount(Long activeEmployeesCount) {
        this.activeEmployeesCount = activeEmployeesCount;
    }

    public Long getFinalizedPeriodsCount() {
        return finalizedPeriodsCount;
    }

    public void setFinalizedPeriodsCount(Long finalizedPeriodsCount) {
        this.finalizedPeriodsCount = finalizedPeriodsCount;
    }

    public BigDecimal getTotalFinalizedNetSalary() {
        return totalFinalizedNetSalary;
    }

    public void setTotalFinalizedNetSalary(BigDecimal totalFinalizedNetSalary) {
        this.totalFinalizedNetSalary = totalFinalizedNetSalary;
    }

    public BigDecimal getTotalPaidSalary() {
        return totalPaidSalary;
    }

    public void setTotalPaidSalary(BigDecimal totalPaidSalary) {
        this.totalPaidSalary = totalPaidSalary;
    }

    public BigDecimal getTotalUnpaidSalary() {
        return totalUnpaidSalary;
    }

    public void setTotalUnpaidSalary(BigDecimal totalUnpaidSalary) {
        this.totalUnpaidSalary = totalUnpaidSalary;
    }

    public BigDecimal getTotalAllowances() {
        return totalAllowances;
    }

    public void setTotalAllowances(BigDecimal totalAllowances) {
        this.totalAllowances = totalAllowances;
    }

    public BigDecimal getTotalDeductions() {
        return totalDeductions;
    }

    public void setTotalDeductions(BigDecimal totalDeductions) {
        this.totalDeductions = totalDeductions;
    }

    // Frontend compatibility alias
    public BigDecimal getOutstandingPayrollDebt() {
        return totalUnpaidSalary;
    }
}
