package com.banquethub.modules.catalog.dto;

import com.banquethub.modules.catalog.entity.RecipeItem;

import java.math.BigDecimal;

public class RecipeItemResponse {

    private Long id;
    private Long ingredientId;
    private String ingredientCode;
    private String ingredientName;
    private String unit;
    private BigDecimal quantity;
    private String note;

    public RecipeItemResponse() {
    }

    public static RecipeItemResponse fromEntity(RecipeItem entity) {
        RecipeItemResponse dto = new RecipeItemResponse();
        dto.setId(entity.getId());
        dto.setIngredientId(entity.getIngredient().getId());
        dto.setIngredientCode(entity.getIngredient().getCode());
        dto.setIngredientName(entity.getIngredient().getName());
        dto.setUnit(entity.getIngredient().getUnit());
        dto.setQuantity(entity.getQuantity());
        dto.setNote(entity.getNote());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIngredientId() {
        return ingredientId;
    }

    public void setIngredientId(Long ingredientId) {
        this.ingredientId = ingredientId;
    }

    public String getIngredientCode() {
        return ingredientCode;
    }

    public void setIngredientCode(String ingredientCode) {
        this.ingredientCode = ingredientCode;
    }

    public String getIngredientName() {
        return ingredientName;
    }

    public void setIngredientName(String ingredientName) {
        this.ingredientName = ingredientName;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
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
