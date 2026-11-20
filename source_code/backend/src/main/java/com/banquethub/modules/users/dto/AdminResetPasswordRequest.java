package com.banquethub.modules.users.dto;

import jakarta.validation.constraints.Size;

public class AdminResetPasswordRequest {

    @Size(min = 6, max = 50, message = "Mật khẩu mới phải từ 6 đến 50 ký tự nếu được chỉ định")
    private String newPassword;

    public AdminResetPasswordRequest() {
    }

    public AdminResetPasswordRequest(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
