package com.banquethub.modules.ai.dto;

import java.math.BigDecimal;

public class MenuSuggestionItemDto {

    private Long dishId;
    private String dishCode;
    private String dishName;
    private String dishImageUrl;
    private String categoryName;
    private Integer quantityPerTable;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;

    public MenuSuggestionItemDto() {
    }

    public MenuSuggestionItemDto(Long dishId, String dishCode, String dishName, String dishImageUrl, String categoryName, Integer quantityPerTable, BigDecimal unitPrice, BigDecimal lineTotal) {
        this.dishId = dishId;
        this.dishCode = dishCode;
        this.dishName = dishName;
        this.dishImageUrl = dishImageUrl;
        this.categoryName = categoryName;
        this.quantityPerTable = quantityPerTable;
        this.unitPrice = unitPrice;
        this.lineTotal = lineTotal;
    }

    public Long getDishId() {
        return dishId;
    }

    public void setDishId(Long dishId) {
        this.dishId = dishId;
    }

    public String getDishCode() {
        return dishCode;
    }

    public void setDishCode(String dishCode) {
        this.dishCode = dishCode;
    }

    public String getDishName() {
        return dishName;
    }

    public void setDishName(String dishName) {
        this.dishName = dishName;
    }

    public String getDishImageUrl() {
        return dishImageUrl;
    }

    public void setDishImageUrl(String dishImageUrl) {
        this.dishImageUrl = dishImageUrl;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Integer getQuantityPerTable() {
        return quantityPerTable;
    }

    public void setQuantityPerTable(Integer quantityPerTable) {
        this.quantityPerTable = quantityPerTable;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }
}
