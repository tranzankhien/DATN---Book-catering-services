package com.banquethub.modules.payroll.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdatePayrollAdjustmentRequest(
        @JsonAlias({"reason", "description"})
        @Size(max = 150, message = "Tên khoản không vượt quá 150 ký tự")
        String name,

        @JsonAlias({"name", "description"})
        @Size(max = 150, message = "Lý do điều chỉnh không vượt quá 150 ký tự")
        String reason,

        @NotNull(message = "Số tiền không được để trống")
        @DecimalMin(value = "0.01", inclusive = true, message = "Số tiền phải lớn hơn 0")
        BigDecimal amount,

        @Size(max = 255, message = "Ghi chú không vượt quá 255 ký tự")
        String note
) {
    public UpdatePayrollAdjustmentRequest(
            String name,
            BigDecimal amount,
            String note
    ) {
        this(name, name, amount, note);
    }

    public String effectiveName() {
        if (name != null && !name.isBlank()) {
            return name.trim();
        }
        if (reason != null && !reason.isBlank()) {
            return reason.trim();
        }
        return "Điều chỉnh lương";
    }
}
