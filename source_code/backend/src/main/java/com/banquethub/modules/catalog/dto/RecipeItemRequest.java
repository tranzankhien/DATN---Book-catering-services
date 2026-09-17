package com.banquethub.modules.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class RecipeItemRequest {

    @NotNull(message = "Nguyên liệu không được để trống")
    private Long ingredientId;

    @NotNull(message = "Định lượng nguyên liệu không được để trống")
    @DecimalMin(value = "0.001", inclusive = true, message = "Định lượng nguyên liệu cho 01 phần món phải lớn hơn 0")
    private BigDecimal quantity;

    @Size(max = 255, message = "Ghi chú công thức không vượt quá 255 ký tự")
    private String note;

    public RecipeItemRequest() {
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

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
