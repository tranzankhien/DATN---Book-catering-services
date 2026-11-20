package com.banquethub.modules.users.dto;

public class AdminResetPasswordResponse {

    private Long userId;
    private String email;
    private String newPassword;
    private String message;

    public AdminResetPasswordResponse() {
    }

    public AdminResetPasswordResponse(Long userId, String email, String newPassword, String message) {
        this.userId = userId;
        this.email = email;
        this.newPassword = newPassword;
        this.message = message;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
