package com.banquethub.modules.menus.dto;

import com.banquethub.modules.menus.entity.MenuStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateMenuStatusRequest {

    @NotNull(message = "Trạng thái không được để trống")
    private MenuStatus status;

    public UpdateMenuStatusRequest() {}

    public UpdateMenuStatusRequest(MenuStatus status) {
        this.status = status;
    }

    public MenuStatus getStatus() {
        return status;
    }

    public void setStatus(MenuStatus status) {
        this.status = status;
    }
}
