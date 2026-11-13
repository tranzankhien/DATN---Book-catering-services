package com.banquethub.modules.payroll.dto;

import com.banquethub.modules.payroll.entity.PaymentMethod;
import com.banquethub.modules.payroll.entity.SalaryPayment;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record SalaryPaymentDto(
        Long id,
        Long payrollId,
        Long employeeId,
        String employeeCode,
        String employeeName,
        BigDecimal amount,
        LocalDate paymentDate,
        PaymentMethod paymentMethod,
        String note,
        String recordedBy,
        OffsetDateTime recordedAt
) {
    public static SalaryPaymentDto fromEntity(SalaryPayment sp) {
        if (sp == null) return null;
        return new SalaryPaymentDto(
                sp.getId(),
                sp.getPayroll() != null ? sp.getPayroll().getId() : null,
                sp.getPayroll() != null && sp.getPayroll().getEmployee() != null ? sp.getPayroll().getEmployee().getId() : null,
                sp.getPayroll() != null ? sp.getPayroll().getEmployeeCodeSnapshot() : null,
                sp.getPayroll() != null ? sp.getPayroll().getEmployeeNameSnapshot() : null,
                sp.getAmount(),
                sp.getPaymentDate(),
                sp.getPaymentMethod(),
                sp.getNote(),
                sp.getRecordedBy(),
                sp.getRecordedAt()
        );
    }
}
