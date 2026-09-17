package com.banquethub.modules.catalog.dto;

import com.banquethub.modules.catalog.entity.Ingredient;

import java.math.BigDecimal;

public class IngredientResponse {

    private Long id;
    private String code;
    private String name;
    private String unit;
    private BigDecimal minStockThreshold;
    private BigDecimal currentStock;
    private BigDecimal avgUnitCost;
    private boolean lowStock;
    private boolean active;

    public IngredientResponse() {
    }

    public static IngredientResponse fromEntity(Ingredient entity) {
        IngredientResponse dto = new IngredientResponse();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        dto.setUnit(entity.getUnit());
        dto.setMinStockThreshold(entity.getMinStockThreshold());
        dto.setCurrentStock(entity.getCurrentStock());
        dto.setAvgUnitCost(entity.getAvgUnitCost());
        dto.setLowStock(entity.getCurrentStock().compareTo(entity.getMinStockThreshold()) <= 0);
        dto.setActive(entity.isActive());
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

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getMinStockThreshold() {
        return minStockThreshold;
    }

    public void setMinStockThreshold(BigDecimal minStockThreshold) {
        this.minStockThreshold = minStockThreshold;
    }

    public BigDecimal getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(BigDecimal currentStock) {
        this.currentStock = currentStock;
    }

    public BigDecimal getAvgUnitCost() {
        return avgUnitCost;
    }

    public void setAvgUnitCost(BigDecimal avgUnitCost) {
        this.avgUnitCost = avgUnitCost;
    }

    public boolean isLowStock() {
        return lowStock;
    }

    public void setLowStock(boolean lowStock) {
        this.lowStock = lowStock;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
