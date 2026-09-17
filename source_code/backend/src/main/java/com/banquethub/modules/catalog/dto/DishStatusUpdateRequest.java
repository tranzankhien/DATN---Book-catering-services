package com.banquethub.modules.catalog.dto;

import com.banquethub.modules.catalog.entity.DishStatus;
import jakarta.validation.constraints.NotNull;

public class DishStatusUpdateRequest {

    @NotNull(message = "Trạng thái món ăn không được để trống")
    private DishStatus status;

    public DishStatusUpdateRequest() {
    }

    public DishStatus getStatus() {
        return status;
    }

    public void setStatus(DishStatus status) {
        this.status = status;
    }
}
