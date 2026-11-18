package com.banquethub.modules.expenses.dto;

import com.banquethub.modules.expenses.entity.ExpenseCategory;
import com.banquethub.modules.expenses.entity.ExpensePaymentStatus;
import com.banquethub.modules.expenses.entity.OperatingExpense;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class ExpenseResponse {

    private Long id;
    private String expenseCode;
    private String name;
    private ExpenseCategory category;
    private String categoryDescription;
    private BigDecimal amount;
    private LocalDate incurredDate;
    private ExpensePaymentStatus paymentStatus;
    private OffsetDateTime paidAt;
    private String note;
    private String createdByName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public ExpenseResponse() {}

    public static ExpenseResponse fromEntity(OperatingExpense e) {
        ExpenseResponse resp = new ExpenseResponse();
        resp.setId(e.getId());
        resp.setExpenseCode(e.getExpenseCode());
        resp.setName(e.getName());
        resp.setCategory(e.getCategory());
        resp.setCategoryDescription(e.getCategory() != null ? e.getCategory().getDescription() : "");
        resp.setAmount(e.getAmount());
        resp.setIncurredDate(e.getIncurredDate());
        resp.setPaymentStatus(e.getPaymentStatus());
        resp.setPaidAt(e.getPaidAt());
        resp.setNote(e.getNote());
        resp.setCreatedByName(e.getCreatedBy() != null ? e.getCreatedBy().getFullName() : "Hệ thống");
        resp.setCreatedAt(e.getCreatedAt());
        resp.setUpdatedAt(e.getUpdatedAt());
        return resp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getExpenseCode() {
        return expenseCode;
    }

    public void setExpenseCode(String expenseCode) {
        this.expenseCode = expenseCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public ExpenseCategory getCategory() {
        return category;
    }

    public void setCategory(ExpenseCategory category) {
        this.category = category;
    }

    public String getCategoryDescription() {
        return categoryDescription;
    }

    public void setCategoryDescription(String categoryDescription) {
        this.categoryDescription = categoryDescription;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDate getIncurredDate() {
        return incurredDate;
    }

    public void setIncurredDate(LocalDate incurredDate) {
        this.incurredDate = incurredDate;
    }

    public ExpensePaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(ExpensePaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public OffsetDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(OffsetDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
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
