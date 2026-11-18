package com.banquethub.modules.reports.dto;

public class DashboardAlertDto {

    private String type;     // WARNING, INFO, ERROR
    private String category; // INVENTORY, ORDER, PAYMENT, PAYROLL, SUPPLIER
    private String title;
    private String message;
    private String link;     // Đường dẫn điều hướng xử lý nhanh

    public DashboardAlertDto() {}

    public DashboardAlertDto(String type, String category, String title, String message, String link) {
        this.type = type;
        this.category = category;
        this.title = title;
        this.message = message;
        this.link = link;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getLink() {
        return link;
    }

    public void setLink(String link) {
        this.link = link;
    }
}
