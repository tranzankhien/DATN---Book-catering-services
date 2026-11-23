package com.banquethub.modules.reservations.dto;

import com.banquethub.modules.reservations.entity.StockReservationItem;

import java.math.BigDecimal;

public class StockReservationItemResponse {

    private Long id;
    private Long ingredientId;
    private String ingredientCode;
    private String ingredientName;
    private String unit;
    private BigDecimal reservedQuantity;

    public StockReservationItemResponse() {}

    public static StockReservationItemResponse fromEntity(StockReservationItem item) {
        StockReservationItemResponse resp = new StockReservationItemResponse();
        resp.setId(item.getId());
        if (item.getIngredient() != null) {
            resp.setIngredientId(item.getIngredient().getId());
            resp.setIngredientCode(item.getIngredient().getCode());
            resp.setIngredientName(item.getIngredient().getName());
            resp.setUnit(item.getUnit() != null ? item.getUnit() : item.getIngredient().getUnit());
        }
        resp.setReservedQuantity(item.getReservedQuantity());
        return resp;
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

    public BigDecimal getReservedQuantity() {
        return reservedQuantity;
    }

    public void setReservedQuantity(BigDecimal reservedQuantity) {
        this.reservedQuantity = reservedQuantity;
    }

    // Frontend compatibility alias
    public BigDecimal getQuantity() {
        return reservedQuantity;
    }
}
