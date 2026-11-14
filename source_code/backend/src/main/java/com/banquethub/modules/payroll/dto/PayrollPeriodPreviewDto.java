package com.banquethub.modules.payroll.dto;

import com.banquethub.modules.payroll.entity.PayrollPeriodStatus;

import java.math.BigDecimal;
import java.util.List;

public record PayrollPeriodPreviewDto(
        Long periodId,
        int year,
        int month,
        BigDecimal standardWorkdays,
        PayrollPeriodStatus status,
        int totalEmployees,
        BigDecimal totalCalculatedSalary,
        BigDecimal totalAllowances,
        BigDecimal totalDeductions,
        BigDecimal totalNetSalary,
        boolean canFinalize,
        List<String> globalWarnings,
        List<PayrollPreviewItemDto> items,
        String previewHash
) {
    public PayrollPeriodPreviewDto(
            Long periodId,
            int year,
            int month,
            BigDecimal standardWorkdays,
            PayrollPeriodStatus status,
            int totalEmployees,
            BigDecimal totalCalculatedSalary,
            BigDecimal totalAllowances,
            BigDecimal totalDeductions,
            BigDecimal totalNetSalary,
            boolean canFinalize,
            List<String> globalWarnings,
            List<PayrollPreviewItemDto> items
    ) {
        this(periodId, year, month, standardWorkdays, status, totalEmployees,
                totalCalculatedSalary, totalAllowances, totalDeductions, totalNetSalary,
                canFinalize, globalWarnings, items, null);
    }

    public record PayrollPreviewItemDto(
            Long employeeId,
            String employeeCode,
            String employeeName,
            String position,
            BigDecimal baseSalary,
            BigDecimal standardWorkdays,
            BigDecimal actualWorkdays,
            BigDecimal calculatedSalary,
            BigDecimal totalAllowances,
            BigDecimal totalDeductions,
            BigDecimal netSalary,
            List<String> warnings
    ) {
    }
}
