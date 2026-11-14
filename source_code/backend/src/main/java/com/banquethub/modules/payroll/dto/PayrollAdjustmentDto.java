package com.banquethub.modules.payroll.dto;

import com.banquethub.modules.payroll.entity.AdjustmentType;
import com.banquethub.modules.payroll.entity.PayrollAdjustment;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PayrollAdjustmentDto(
        Long id,
        Long employeeId,
        String employeeCode,
        String employeeName,
        Long payrollPeriodId,
        AdjustmentType adjustmentType,
        String name,
        String reason,
        BigDecimal amount,
        String note,
        String createdBy,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static PayrollAdjustmentDto fromEntity(PayrollAdjustment a) {
        if (a == null) return null;
        return new PayrollAdjustmentDto(
                a.getId(),
                a.getEmployee() != null ? a.getEmployee().getId() : null,
                a.getEmployee() != null ? a.getEmployee().getEmployeeCode() : null,
                a.getEmployee() != null ? a.getEmployee().getFullName() : null,
                a.getPayrollPeriod() != null ? a.getPayrollPeriod().getId() : null,
                a.getAdjustmentType(),
                a.getName(),
                a.getName(),
                a.getAmount(),
                a.getNote(),
                a.getCreatedBy(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
