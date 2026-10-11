package com.banquethub.modules.orders.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CreateOrderItemRequest {

    @NotNull(message = "ID món ăn không được để trống")
    private Long dishId;

    @NotNull(message = "Số lượng món mỗi bàn không được để trống")
    @Min(value = 1, message = "Số lượng món mỗi bàn phải từ 1 trở lên")
    private Integer quantityPerTable = 1;

    public CreateOrderItemRequest() {}

    public CreateOrderItemRequest(Long dishId, Integer quantityPerTable) {
        this.dishId = dishId;
        this.quantityPerTable = quantityPerTable;
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
}
