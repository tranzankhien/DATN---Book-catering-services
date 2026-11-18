package com.banquethub.modules.reports.dto;

public class OrderStatusStatDto {

    private String statusCode;
    private String statusName;
    private Long count = 0L;
    private Double percentage = 0.0;
    private String color;

    public OrderStatusStatDto() {}

    public OrderStatusStatDto(String statusCode, String statusName, Long count, Double percentage, String color) {
        this.statusCode = statusCode;
        this.statusName = statusName;
        this.count = count != null ? count : 0L;
        this.percentage = percentage != null ? percentage : 0.0;
        this.color = color;
    }

    public String getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(String statusCode) {
        this.statusCode = statusCode;
    }

    public String getStatusName() {
        return statusName;
    }

    public void setStatusName(String statusName) {
        this.statusName = statusName;
    }

    public Long getCount() {
        return count;
    }

    public void setCount(Long count) {
        this.count = count;
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
