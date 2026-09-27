package com.banquethub.modules.suppliers.dto;

import com.banquethub.modules.suppliers.entity.Supplier;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class SupplierResponse {

    private Long id;
    private String code;
    private String name;
    private String phone;
    private String email;
    private String address;
    private String note;
    private boolean active;
    private BigDecimal totalPurchasedAmount = BigDecimal.ZERO;
    private long totalReceiptsCount = 0;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public SupplierResponse() {
    }

    public static SupplierResponse fromEntity(Supplier entity) {
        return fromEntity(entity, BigDecimal.ZERO, 0);
    }

    public static SupplierResponse fromEntity(Supplier entity, BigDecimal totalPurchased, long receiptsCount) {
        SupplierResponse dto = new SupplierResponse();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        dto.setPhone(entity.getPhone());
        dto.setEmail(entity.getEmail());
        dto.setAddress(entity.getAddress());
        dto.setNote(entity.getNote());
        dto.setActive(entity.isActive());
        dto.setTotalPurchasedAmount(totalPurchased != null ? totalPurchased : BigDecimal.ZERO);
        dto.setTotalReceiptsCount(receiptsCount);
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public BigDecimal getTotalPurchasedAmount() {
        return totalPurchasedAmount;
    }

    public void setTotalPurchasedAmount(BigDecimal totalPurchasedAmount) {
        this.totalPurchasedAmount = totalPurchasedAmount;
    }

    public long getTotalReceiptsCount() {
        return totalReceiptsCount;
    }

    public void setTotalReceiptsCount(long totalReceiptsCount) {
        this.totalReceiptsCount = totalReceiptsCount;
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
}
