package com.banquethub.modules.employees.dto;

import com.banquethub.modules.employees.entity.EmployeeStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateEmployeeStatusRequest(
        @NotNull(message = "Trạng thái không được để trống")
        EmployeeStatus status
) {
}
