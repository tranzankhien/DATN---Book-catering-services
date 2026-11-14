package com.banquethub.modules.payroll.dto;

import java.math.BigDecimal;

public record FinalizePayrollPeriodRequest(
        BigDecimal expectedTotalNetSalary,
        Integer expectedEmployeeCount
) {
}
