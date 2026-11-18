package com.banquethub.modules.reports.dto;

import java.math.BigDecimal;

public class TimeSeriesPoint {

    private String label; // "2026-11-01" hoặc "Tháng 11/2026"
    private String date;  // YYYY-MM-DD
    private BigDecimal value = BigDecimal.ZERO;
    private Long count = 0L;
    private BigDecimal secondaryValue = BigDecimal.ZERO;
    private BigDecimal thirdValue = BigDecimal.ZERO;

    public TimeSeriesPoint() {}

    public TimeSeriesPoint(String label, String date, BigDecimal value, Long count) {
        this.label = label;
        this.date = date;
        this.value = value != null ? value : BigDecimal.ZERO;
        this.count = count != null ? count : 0L;
    }

    public TimeSeriesPoint(String label, String date, BigDecimal value, BigDecimal secondaryValue, BigDecimal thirdValue) {
        this.label = label;
        this.date = date;
        this.value = value != null ? value : BigDecimal.ZERO;
        this.secondaryValue = secondaryValue != null ? secondaryValue : BigDecimal.ZERO;
        this.thirdValue = thirdValue != null ? thirdValue : BigDecimal.ZERO;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public BigDecimal getValue() {
        return value;
    }

    public void setValue(BigDecimal value) {
        this.value = value;
    }

    public Long getCount() {
        return count;
    }

    public void setCount(Long count) {
        this.count = count;
    }

    public BigDecimal getSecondaryValue() {
        return secondaryValue;
    }

    public void setSecondaryValue(BigDecimal secondaryValue) {
        this.secondaryValue = secondaryValue;
    }

    public BigDecimal getThirdValue() {
        return thirdValue;
    }

    public void setThirdValue(BigDecimal thirdValue) {
        this.thirdValue = thirdValue;
    }
}
