package com.banquethub.modules.inventory.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class StockReceiptItemRequest {

    @NotNull(message = "Nguyên liệu không được để trống")
    private Long ingredientId;

    @NotNull(message = "Số lượng nhập không được để trống")
    @DecimalMin(value = "0.001", inclusive = true, message = "Số lượng nhập phải lớn hơn 0")
    private BigDecimal quantity;

    @NotNull(message = "Đơn giá nhập không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Đơn giá nhập không được âm")
    private BigDecimal unitPrice;

    public StockReceiptItemRequest() {
    }

    public StockReceiptItemRequest(Long ingredientId, BigDecimal quantity, BigDecimal unitPrice) {
        this.ingredientId = ingredientId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    public Long getIngredientId() {
        return ingredientId;
    }

    public void setIngredientId(Long ingredientId) {
        this.ingredientId = ingredientId;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }
}
