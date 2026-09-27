package com.banquethub.modules.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class StockAdjustmentRequest {

    @NotNull(message = "Nguyên liệu điều chỉnh không được để trống")
    private Long ingredientId;

    @NotNull(message = "Số lượng điều chỉnh không được để trống")
    private BigDecimal quantityChange;

    @NotBlank(message = "Lý do điều chỉnh tồn kho bắt buộc phải nhập")
    @Size(max = 500, message = "Lý do điều chỉnh không vượt quá 500 ký tự")
    private String reason;

    public StockAdjustmentRequest() {
    }

    public StockAdjustmentRequest(Long ingredientId, BigDecimal quantityChange, String reason) {
        this.ingredientId = ingredientId;
        this.quantityChange = quantityChange;
        this.reason = reason;
    }

    public Long getIngredientId() {
        return ingredientId;
    }

    public void setIngredientId(Long ingredientId) {
        this.ingredientId = ingredientId;
    }

    public BigDecimal getQuantityChange() {
        return quantityChange;
    }

    public void setQuantityChange(BigDecimal quantityChange) {
        this.quantityChange = quantityChange;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
