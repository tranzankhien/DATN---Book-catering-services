package com.banquethub.modules.reports.dto;

import java.math.BigDecimal;

public class CostBreakdownDto {

    private String category;
    private String name;
    private BigDecimal amount = BigDecimal.ZERO;
    private Double percentage = 0.0;
    private String color;

    public CostBreakdownDto() {}

    public CostBreakdownDto(String category, String name, BigDecimal amount, Double percentage, String color) {
        this.category = category;
        this.name = name;
        this.amount = amount != null ? amount : BigDecimal.ZERO;
        this.percentage = percentage != null ? percentage : 0.0;
        this.color = color;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Double getPercentage() {
        return percentage;
    }

    public void setPercentage(Double percentage) {
        this.percentage = percentage;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}
