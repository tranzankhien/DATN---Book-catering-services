package com.banquethub.modules.employees.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateEmployeeRequest(
        @Size(max = 30, message = "Mã nhân viên không được vượt quá 30 ký tự")
        String employeeCode,

        Long userId,

        @NotBlank(message = "Họ và tên nhân viên không được để trống")
        @Size(max = 120, message = "Họ và tên không được vượt quá 120 ký tự")
        String fullName,

        @Size(max = 25, message = "Số điện thoại không được vượt quá 25 ký tự")
        String phone,

        @Size(max = 150, message = "Email không được vượt quá 150 ký tự")
        String email,

        @NotBlank(message = "Chức vụ không được để trống")
        @Size(max = 80, message = "Chức vụ không được vượt quá 80 ký tự")
        String position,

        @NotNull(message = "Ngày vào làm không được để trống")
        LocalDate hireDate,

        @NotNull(message = "Mức lương cơ bản không được để trống")
        @DecimalMin(value = "0.0", inclusive = true, message = "Mức lương cơ bản không được âm")
        BigDecimal baseSalary,

        String note
) {
}
