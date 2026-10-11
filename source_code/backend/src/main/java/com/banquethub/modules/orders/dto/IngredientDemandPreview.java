package com.banquethub.modules.orders.dto;

import java.math.BigDecimal;

public class IngredientDemandPreview {

    private Long ingredientId;
    private String ingredientCode;
    private String ingredientName;
    private String unit;
    private BigDecimal requiredQuantity;
    private BigDecimal physicalStock;
    private BigDecimal activeReservedStock;
    private BigDecimal availableStock;
    private boolean sufficient;
    private BigDecimal shortageQuantity;

    public IngredientDemandPreview() {}

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

    public BigDecimal getRequiredQuantity() {
        return requiredQuantity;
    }

    public void setRequiredQuantity(BigDecimal requiredQuantity) {
        this.requiredQuantity = requiredQuantity;
    }

    public BigDecimal getPhysicalStock() {
        return physicalStock;
    }

    public void setPhysicalStock(BigDecimal physicalStock) {
        this.physicalStock = physicalStock;
    }

    public BigDecimal getActiveReservedStock() {
        return activeReservedStock;
    }

    public void setActiveReservedStock(BigDecimal activeReservedStock) {
        this.activeReservedStock = activeReservedStock;
    }

    public BigDecimal getAvailableStock() {
        return availableStock;
    }

    public void setAvailableStock(BigDecimal availableStock) {
        this.availableStock = availableStock;
    }

    public boolean isSufficient() {
        return sufficient;
    }

    public void setSufficient(boolean sufficient) {
        this.sufficient = sufficient;
    }

    public BigDecimal getShortageQuantity() {
        return shortageQuantity;
    }

    public void setShortageQuantity(BigDecimal shortageQuantity) {
        this.shortageQuantity = shortageQuantity;
    }
}
