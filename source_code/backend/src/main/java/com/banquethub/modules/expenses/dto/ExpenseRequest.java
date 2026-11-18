package com.banquethub.modules.expenses.dto;

import com.banquethub.modules.expenses.entity.ExpenseCategory;
import com.banquethub.modules.expenses.entity.ExpensePaymentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseRequest {

    @NotBlank(message = "Tên khoản chi phí không được để trống")
    @Size(max = 200, message = "Tên khoản chi không được vượt quá 200 ký tự")
    private String name;

    @NotNull(message = "Loại chi phí không được để trống")
    private ExpenseCategory category;

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "1000", message = "Số tiền chi phí tối thiểu là 1.000 VNĐ")
    private BigDecimal amount;

    @NotNull(message = "Ngày phát sinh chi phí không được để trống")
    private LocalDate incurredDate;

    private ExpensePaymentStatus paymentStatus = ExpensePaymentStatus.UNPAID;

    @Size(max = 1000, message = "Ghi chú không được vượt quá 1000 ký tự")
    private String note;

    public ExpenseRequest() {}

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

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
