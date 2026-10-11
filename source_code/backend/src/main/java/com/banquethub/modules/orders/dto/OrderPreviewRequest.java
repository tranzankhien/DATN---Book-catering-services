package com.banquethub.modules.orders.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class OrderPreviewRequest {

    private Long menuId;

    @NotNull(message = "Số lượng bàn không được để trống")
    @Min(value = 1, message = "Số lượng bàn phải từ 1 trở lên")
    private Integer tableCount = 1;

    @Valid
    private List<OrderPreviewItemRequest> items;

    public OrderPreviewRequest() {}

    public OrderPreviewRequest(Long menuId, Integer tableCount, List<OrderPreviewItemRequest> items) {
        this.menuId = menuId;
        this.tableCount = tableCount;
        this.items = items;
    }

    public Long getMenuId() {
        return menuId;
    }

    public void setMenuId(Long menuId) {
        this.menuId = menuId;
    }

    public Integer getTableCount() {
        return tableCount;
    }

    public void setTableCount(Integer tableCount) {
        this.tableCount = tableCount;
    }

    public List<OrderPreviewItemRequest> getItems() {
        return items;
    }

    public void setItems(List<OrderPreviewItemRequest> items) {
        this.items = items;
    }
}
