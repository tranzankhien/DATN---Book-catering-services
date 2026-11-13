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
        OffsetDateTime updatedAt
) {
    public static PayrollPeriodDto fromEntity(PayrollPeriod p) {
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
                p.getUpdatedAt()
        );
    }
}
