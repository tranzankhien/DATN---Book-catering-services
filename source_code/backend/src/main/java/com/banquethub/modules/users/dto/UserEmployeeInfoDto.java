package com.banquethub.modules.users.dto;

import com.banquethub.modules.employees.entity.EmployeeStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public class UserEmployeeInfoDto {

    private Long id;
    private String employeeCode;
    private String fullName;
    private String position;
    private LocalDate hireDate;
    private BigDecimal baseSalary;
    private EmployeeStatus status;

    public UserEmployeeInfoDto() {
    }

    public UserEmployeeInfoDto(Long id, String employeeCode, String fullName, String position, LocalDate hireDate, BigDecimal baseSalary, EmployeeStatus status) {
        this.id = id;
        this.employeeCode = employeeCode;
        this.fullName = fullName;
        this.position = position;
        this.hireDate = hireDate;
        this.baseSalary = baseSalary;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmployeeCode() {
        return employeeCode;
    }

    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public LocalDate getHireDate() {
        return hireDate;
    }

    public void setHireDate(LocalDate hireDate) {
        this.hireDate = hireDate;
    }

    public BigDecimal getBaseSalary() {
        return baseSalary;
    }

    public void setBaseSalary(BigDecimal baseSalary) {
        this.baseSalary = baseSalary;
    }

    public EmployeeStatus getStatus() {
        return status;
    }

    public void setStatus(EmployeeStatus status) {
        this.status = status;
    }
}
