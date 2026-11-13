package com.banquethub.modules.payroll.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdatePayrollPeriodRequest(
        @NotNull(message = "Số ngày công chuẩn không được để trống")
        @DecimalMin(value = "0.1", inclusive = true, message = "Số công chuẩn phải lớn hơn 0")
        BigDecimal standardWorkdays,

        @Size(max = 255, message = "Ghi chú không vượt quá 255 ký tự")
        String note
) {
}
