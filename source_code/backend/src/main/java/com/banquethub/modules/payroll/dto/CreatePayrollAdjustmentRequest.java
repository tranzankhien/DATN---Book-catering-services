package com.banquethub.modules.payroll.dto;

import com.banquethub.modules.payroll.entity.AdjustmentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreatePayrollAdjustmentRequest(
        @NotNull(message = "ID nhân viên không được để trống")
        Long employeeId,

        @NotNull(message = "ID kỳ lương không được để trống")
        Long payrollPeriodId,

        @NotNull(message = "Loại điều chỉnh (ALLOWANCE/DEDUCTION) không được để trống")
        AdjustmentType adjustmentType,

        @NotBlank(message = "Tên khoản điều chỉnh không được để trống")
        @Size(max = 150, message = "Tên khoản không vượt quá 150 ký tự")
        String name,

        @NotNull(message = "Số tiền không được để trống")
        @DecimalMin(value = "0.01", inclusive = true, message = "Số tiền phải lớn hơn 0")
        BigDecimal amount,

        @Size(max = 255, message = "Ghi chú không vượt quá 255 ký tự")
        String note
) {
}
