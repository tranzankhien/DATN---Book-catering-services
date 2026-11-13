package com.banquethub.modules.payroll.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreatePayrollPeriodRequest(
        @NotNull(message = "Năm không được để trống")
        @Min(value = 2000, message = "Năm phải từ 2000 trở lên")
        @Max(value = 2100, message = "Năm không hợp lệ")
        Integer year,

        @NotNull(message = "Tháng không được để trống")
        @Min(value = 1, message = "Tháng từ 1 đến 12")
        @Max(value = 12, message = "Tháng từ 1 đến 12")
        Integer month,

        @NotNull(message = "Số ngày công chuẩn không được để trống")
        @DecimalMin(value = "0.1", inclusive = true, message = "Số công chuẩn phải lớn hơn 0")
        BigDecimal standardWorkdays,

        @Size(max = 255, message = "Ghi chú không vượt quá 255 ký tự")
        String note
) {
}
