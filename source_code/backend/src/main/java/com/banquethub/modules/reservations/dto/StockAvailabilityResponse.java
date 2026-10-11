package com.banquethub.modules.reservations.dto;

import java.math.BigDecimal;

public class StockAvailabilityResponse {

    private Long ingredientId;
    private String ingredientCode;
    private String ingredientName;
    private String unit;
    private BigDecimal physicalStock;
    private BigDecimal reservedStock;
    private BigDecimal availableStock;
    private BigDecimal minStockThreshold;
    private boolean lowStock;

    public StockAvailabilityResponse() {}

    public StockAvailabilityResponse(Long ingredientId, String ingredientCode, String ingredientName, String unit,
                                   BigDecimal physicalStock, BigDecimal reservedStock, BigDecimal availableStock,
                                   BigDecimal minStockThreshold, boolean lowStock) {
        this.ingredientId = ingredientId;
        this.ingredientCode = ingredientCode;
        this.ingredientName = ingredientName;
        this.unit = unit;
        this.physicalStock = physicalStock;
        this.reservedStock = reservedStock;
        this.availableStock = availableStock;
        this.minStockThreshold = minStockThreshold;
        this.lowStock = lowStock;
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

    public BigDecimal getPhysicalStock() {
        return physicalStock;
    }

    public void setPhysicalStock(BigDecimal physicalStock) {
        this.physicalStock = physicalStock;
    }

    public BigDecimal getReservedStock() {
        return reservedStock;
    }

    public void setReservedStock(BigDecimal reservedStock) {
        this.reservedStock = reservedStock;
    }

    public BigDecimal getAvailableStock() {
        return availableStock;
    }

    public void setAvailableStock(BigDecimal availableStock) {
        this.availableStock = availableStock;
    }

    public BigDecimal getMinStockThreshold() {
        return minStockThreshold;
    }

    public void setMinStockThreshold(BigDecimal minStockThreshold) {
        this.minStockThreshold = minStockThreshold;
    }

    public boolean isLowStock() {
        return lowStock;
    }

    public void setLowStock(boolean lowStock) {
        this.lowStock = lowStock;
    }
}
