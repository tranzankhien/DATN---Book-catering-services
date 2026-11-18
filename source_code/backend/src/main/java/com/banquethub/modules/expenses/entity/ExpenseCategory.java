package com.banquethub.modules.expenses.entity;

public enum ExpenseCategory {
    RENT("Tiền thuê mặt bằng"),
    UTILITIES("Điện, nước, Internet"),
    MARKETING("Quảng cáo & Tiếp thị"),
    CLEANING("Vệ sinh & Bảo trì"),
    OTHER("Chi phí vận hành khác");

    private final String description;

    ExpenseCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
