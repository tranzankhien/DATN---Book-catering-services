package com.banquethub.modules.employees.dto;

import com.banquethub.modules.employees.entity.Employee;
import com.banquethub.modules.employees.entity.EmployeeStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record EmployeeDto(
        Long id,
        String employeeCode,
        Long userId,
        String userFullName,
        String userEmail,
        String fullName,
        String phone,
        String email,
        String position,
        LocalDate hireDate,
        BigDecimal baseSalary,
        EmployeeStatus status,
        String note,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static EmployeeDto fromEntity(Employee entity) {
        if (entity == null) return null;
        return new EmployeeDto(
                entity.getId(),
                entity.getEmployeeCode(),
                entity.getUser() != null ? entity.getUser().getId() : null,
                entity.getUser() != null ? entity.getUser().getFullName() : null,
                entity.getUser() != null ? entity.getUser().getEmail() : null,
                entity.getFullName(),
                entity.getPhone(),
                entity.getEmail(),
                entity.getPosition(),
                entity.getHireDate(),
                entity.getBaseSalary(),
                entity.getStatus(),
                entity.getNote(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
