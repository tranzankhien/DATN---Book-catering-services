package com.banquethub.modules.payroll.dto;

import com.banquethub.modules.payroll.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RecordSalaryPaymentRequest(
        LocalDate paymentDate,

        @NotNull(message = "Phương thức thanh toán không được để trống")
        PaymentMethod paymentMethod,

        @Size(max = 255, message = "Ghi chú không được vượt quá 255 ký tự")
        String note
) {
}
