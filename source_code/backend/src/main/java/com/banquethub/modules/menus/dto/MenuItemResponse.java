package com.banquethub.modules.menus.dto;

import com.banquethub.modules.menus.entity.MenuItem;

import java.math.BigDecimal;

public class MenuItemResponse {

    private Long id;
    private Long dishId;
    private String dishCode;
    private String dishName;
    private String dishImageUrl;
    private String categoryName;
    private BigDecimal dishPrice;
    private Integer quantityPerTable;
    private BigDecimal lineTotalPerTable;
    private Integer displayOrder;

    public MenuItemResponse() {}

    public static MenuItemResponse fromEntity(MenuItem item) {
        MenuItemResponse resp = new MenuItemResponse();
        resp.setId(item.getId());
        if (item.getDish() != null) {
            resp.setDishId(item.getDish().getId());
            resp.setDishCode(item.getDish().getCode());
            resp.setDishName(item.getDish().getName());
            resp.setDishImageUrl(item.getDish().getImageUrl());
            if (item.getDish().getCategory() != null) {
                resp.setCategoryName(item.getDish().getCategory().getName());
            }
            resp.setDishPrice(item.getDish().getPrice());
        }
        resp.setQuantityPerTable(item.getQuantityPerTable());
        resp.setLineTotalPerTable(item.calculateLineTotalPerTable());
        resp.setDisplayOrder(item.getDisplayOrder());
        return resp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public BigDecimal getDishPrice() {
        return dishPrice;
    }

    public void setDishPrice(BigDecimal dishPrice) {
        this.dishPrice = dishPrice;
    }

    public Integer getQuantityPerTable() {
        return quantityPerTable;
    }

    public void setQuantityPerTable(Integer quantityPerTable) {
        this.quantityPerTable = quantityPerTable;
    }

    public BigDecimal getLineTotalPerTable() {
        return lineTotalPerTable;
    }

    public void setLineTotalPerTable(BigDecimal lineTotalPerTable) {
        this.lineTotalPerTable = lineTotalPerTable;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
