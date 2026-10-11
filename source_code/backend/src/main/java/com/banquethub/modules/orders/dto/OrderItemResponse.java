package com.banquethub.modules.orders.dto;

import com.banquethub.modules.orders.entity.OrderItem;

import java.math.BigDecimal;

public class OrderItemResponse {

    private Long id;
    private Long dishId;
    private String dishCode;
    private String dishNameSnapshot;
    private String dishImageUrl;
    private BigDecimal unitPriceSnapshot;
    private Integer quantityPerTable;
    private Integer totalQuantity;
    private BigDecimal lineTotal;

    public OrderItemResponse() {}

    public static OrderItemResponse fromEntity(OrderItem item) {
        OrderItemResponse resp = new OrderItemResponse();
        resp.setId(item.getId());
        if (item.getDish() != null) {
            resp.setDishId(item.getDish().getId());
            resp.setDishCode(item.getDish().getCode());
            resp.setDishImageUrl(item.getDish().getImageUrl());
        }
        resp.setDishNameSnapshot(item.getDishNameSnapshot());
        resp.setUnitPriceSnapshot(item.getUnitPriceSnapshot());
        resp.setQuantityPerTable(item.getQuantityPerTable());
        resp.setTotalQuantity(item.getTotalQuantity());
        resp.setLineTotal(item.getLineTotal());
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

    public String getDishNameSnapshot() {
        return dishNameSnapshot;
    }

    public void setDishNameSnapshot(String dishNameSnapshot) {
        this.dishNameSnapshot = dishNameSnapshot;
    }

    public String getDishImageUrl() {
        return dishImageUrl;
    }

    public void setDishImageUrl(String dishImageUrl) {
        this.dishImageUrl = dishImageUrl;
    }

    public BigDecimal getUnitPriceSnapshot() {
        return unitPriceSnapshot;
    }

    public void setUnitPriceSnapshot(BigDecimal unitPriceSnapshot) {
        this.unitPriceSnapshot = unitPriceSnapshot;
    }

    public Integer getQuantityPerTable() {
        return quantityPerTable;
    }

    public void setQuantityPerTable(Integer quantityPerTable) {
        this.quantityPerTable = quantityPerTable;
    }

    public Integer getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(Integer totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }
}
