package com.banquethub.modules.payroll.dto;

import com.banquethub.modules.payroll.entity.PayrollPeriod;
import com.banquethub.modules.payroll.entity.PayrollPeriodStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record PayrollPeriodDto(
        Long id,
        int year,
        int month,
        BigDecimal standardWorkdays,
        PayrollPeriodStatus status,
        String note,
        String createdBy,
        String finalizedBy,
        OffsetDateTime finalizedAt,
        OffsetDateTime closedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        int totalEmployeesCount,
        BigDecimal totalFinalizedAmount,
        int paidCount,
        int unpaidCount
) {
    public static PayrollPeriodDto fromEntity(PayrollPeriod p) {
        return fromEntity(p, 0, BigDecimal.ZERO, 0, 0);
    }

    public static PayrollPeriodDto fromEntity(
            PayrollPeriod p,
            int totalEmployeesCount,
            BigDecimal totalFinalizedAmount,
            int paidCount,
            int unpaidCount
    ) {
        if (p == null) return null;
        return new PayrollPeriodDto(
                p.getId(),
                p.getYear(),
                p.getMonth(),
                p.getStandardWorkdays(),
                p.getStatus(),
                p.getNote(),
                p.getCreatedBy(),
                p.getFinalizedBy(),
                p.getFinalizedAt(),
                p.getClosedAt(),
                p.getCreatedAt(),
                p.getUpdatedAt(),
                totalEmployeesCount,
                totalFinalizedAmount != null ? totalFinalizedAmount : BigDecimal.ZERO,
                paidCount,
                unpaidCount
        );
    }
}
