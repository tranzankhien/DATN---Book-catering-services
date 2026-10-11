package com.banquethub.modules.menus.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class MenuItemRequest {

    @NotNull(message = "ID món ăn không được để trống")
    private Long dishId;

    @NotNull(message = "Số lượng mỗi bàn không được để trống")
    @Min(value = 1, message = "Số lượng mỗi bàn phải từ 1 trở lên")
    private Integer quantityPerTable = 1;

    private Integer displayOrder = 0;

    public MenuItemRequest() {}

    public MenuItemRequest(Long dishId, Integer quantityPerTable, Integer displayOrder) {
        this.dishId = dishId;
        this.quantityPerTable = quantityPerTable;
        this.displayOrder = displayOrder;
    }

    public Long getDishId() {
        return dishId;
    }

    public void setDishId(Long dishId) {
        this.dishId = dishId;
    }

    public Integer getQuantityPerTable() {
        return quantityPerTable;
    }

    public void setQuantityPerTable(Integer quantityPerTable) {
        this.quantityPerTable = quantityPerTable;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
