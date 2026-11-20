package com.banquethub.modules.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 120, message = "Họ và tên không được vượt quá 120 ký tự")
    private String fullName;

    @Size(max = 25, message = "Số điện thoại không được vượt quá 25 ký tự")
    private String phone;

    public UpdateProfileRequest() {
    }

    public UpdateProfileRequest(String fullName, String phone) {
        this.fullName = fullName;
        this.phone = phone;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
