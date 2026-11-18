package com.banquethub.modules.reports.dto;

import java.math.BigDecimal;

public class TopDishReportDto {

    private Long dishId;
    private String dishName;
    private String categoryName;
    private Long totalPortionsSold = 0L;
    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private Double revenueSharePercent = 0.0;

    public TopDishReportDto() {}

    public TopDishReportDto(Long dishId, String dishName, String categoryName, Long totalPortionsSold, BigDecimal totalRevenue, Double revenueSharePercent) {
        this.dishId = dishId;
        this.dishName = dishName;
        this.categoryName = categoryName;
        this.totalPortionsSold = totalPortionsSold != null ? totalPortionsSold : 0L;
        this.totalRevenue = totalRevenue != null ? totalRevenue : BigDecimal.ZERO;
        this.revenueSharePercent = revenueSharePercent != null ? revenueSharePercent : 0.0;
    }

    public Long getDishId() {
        return dishId;
    }

    public void setDishId(Long dishId) {
        this.dishId = dishId;
    }

    public String getDishName() {
        return dishName;
    }

    public void setDishName(String dishName) {
        this.dishName = dishName;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public Long getTotalPortionsSold() {
        return totalPortionsSold;
    }

    public void setTotalPortionsSold(Long totalPortionsSold) {
        this.totalPortionsSold = totalPortionsSold;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public Double getRevenueSharePercent() {
        return revenueSharePercent;
    }

    public void setRevenueSharePercent(Double revenueSharePercent) {
        this.revenueSharePercent = revenueSharePercent;
    }
}
