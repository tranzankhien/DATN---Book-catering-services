package com.banquethub.modules.inventory.dto;

import com.banquethub.modules.inventory.entity.StockAdjustment;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class StockAdjustmentResponse {

    private Long id;
    private String code;
    private Long ingredientId;
    private String ingredientCode;
    private String ingredientName;
    private String unit;
    private BigDecimal quantityChange;
    private String reason;
    private String createdByName;
    private OffsetDateTime createdAt;

    public StockAdjustmentResponse() {
    }

    public static StockAdjustmentResponse fromEntity(StockAdjustment adj) {
        StockAdjustmentResponse dto = new StockAdjustmentResponse();
        dto.setId(adj.getId());
        dto.setCode(adj.getCode());
        dto.setQuantityChange(adj.getQuantityChange());
        dto.setReason(adj.getReason());
        dto.setCreatedByName(adj.getCreatedByName());
        dto.setCreatedAt(adj.getCreatedAt());
        if (adj.getIngredient() != null) {
            dto.setIngredientId(adj.getIngredient().getId());
            dto.setIngredientCode(adj.getIngredient().getCode());
            dto.setIngredientName(adj.getIngredient().getName());
            dto.setUnit(adj.getIngredient().getUnit());
        }
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
}

