package com.banquethub.modules.payroll.dto;

import com.banquethub.modules.payroll.entity.PaymentStatus;
import com.banquethub.modules.payroll.entity.Payroll;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record PayrollDto(
        Long id,
        Long employeeId,
        Long payrollPeriodId,
        int year,
        int month,
        String employeeCodeSnapshot,
        String employeeNameSnapshot,
        BigDecimal baseSalarySnapshot,
        BigDecimal standardWorkdaysSnapshot,
        BigDecimal actualWorkdaysSnapshot,
        BigDecimal calculatedSalary,
        BigDecimal totalAllowances,
        BigDecimal totalDeductions,
        BigDecimal netSalary,
        PaymentStatus paymentStatus,
        OffsetDateTime finalizedAt,
        OffsetDateTime createdAt,
        SalaryPaymentDto paymentDetails,
        List<PayrollAdjustmentDto> adjustments
) {
    public static PayrollDto fromEntity(Payroll p) {
        return fromEntity(p, null, null);
    }

    public static PayrollDto fromEntity(Payroll p, SalaryPaymentDto payment, List<PayrollAdjustmentDto> adjustments) {
        if (p == null) return null;
        return new PayrollDto(
                p.getId(),
                p.getEmployee() != null ? p.getEmployee().getId() : null,
                p.getPayrollPeriod() != null ? p.getPayrollPeriod().getId() : null,
                p.getPayrollPeriod() != null ? p.getPayrollPeriod().getYear() : 0,
                p.getPayrollPeriod() != null ? p.getPayrollPeriod().getMonth() : 0,
                p.getEmployeeCodeSnapshot(),
                p.getEmployeeNameSnapshot(),
                p.getBaseSalarySnapshot(),
                p.getStandardWorkdaysSnapshot(),
                p.getActualWorkdaysSnapshot(),
                p.getCalculatedSalary(),
                p.getTotalAllowances(),
                p.getTotalDeductions(),
                p.getNetSalary(),
                p.getPaymentStatus(),
                p.getFinalizedAt(),
                p.getCreatedAt(),
                payment,
                adjustments
        );
    }
}
