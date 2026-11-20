package com.banquethub.modules.users.dto;

import com.banquethub.modules.users.entity.Role;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class AdminUserDetailDto {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private Role role;
    private boolean active;
    private OffsetDateTime lastLoginAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    private long totalOrders;
    private BigDecimal totalSpent = BigDecimal.ZERO;
    private List<UserOrderSummaryDto> recentOrders = new ArrayList<>();
    private UserEmployeeInfoDto employeeInfo;

    public AdminUserDetailDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public OffsetDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(OffsetDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getTotalSpent() {
        return totalSpent;
    }

    public void setTotalSpent(BigDecimal totalSpent) {
        this.totalSpent = totalSpent;
    }

    public List<UserOrderSummaryDto> getRecentOrders() {
        return recentOrders;
    }

    public void setRecentOrders(List<UserOrderSummaryDto> recentOrders) {
        this.recentOrders = recentOrders;
    }

    public UserEmployeeInfoDto getEmployeeInfo() {
        return employeeInfo;
    }

    public void setEmployeeInfo(UserEmployeeInfoDto employeeInfo) {
        this.employeeInfo = employeeInfo;
    }
}
