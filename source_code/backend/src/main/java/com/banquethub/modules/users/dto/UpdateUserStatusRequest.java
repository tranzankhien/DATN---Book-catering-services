package com.banquethub.modules.users.dto;

import jakarta.validation.constraints.NotNull;

public class UpdateUserStatusRequest {

    @NotNull(message = "Trạng thái kích hoạt (active) là bắt buộc")
    private Boolean active;

    private String reason;

    public UpdateUserStatusRequest() {
    }

    public UpdateUserStatusRequest(Boolean active, String reason) {
        this.active = active;
        this.reason = reason;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
