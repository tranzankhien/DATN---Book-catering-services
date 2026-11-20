package com.banquethub.modules.users.dto;

import com.banquethub.modules.orders.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class UserOrderSummaryDto {

    private Long id;
    private String orderCode;
    private OffsetDateTime eventDateTime;
    private int tableCount;
    private OrderStatus orderStatus;
    private BigDecimal totalAmount;
    private OffsetDateTime createdAt;

    public UserOrderSummaryDto() {
    }

    public UserOrderSummaryDto(Long id, String orderCode, OffsetDateTime eventDateTime, int tableCount, OrderStatus orderStatus, BigDecimal totalAmount, OffsetDateTime createdAt) {
        this.id = id;
        this.orderCode = orderCode;
        this.eventDateTime = eventDateTime;
        this.tableCount = tableCount;
        this.orderStatus = orderStatus;
        this.totalAmount = totalAmount;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public OffsetDateTime getEventDateTime() {
        return eventDateTime;
    }

    public void setEventDateTime(OffsetDateTime eventDateTime) {
        this.eventDateTime = eventDateTime;
    }

    public int getTableCount() {
        return tableCount;
    }

    public void setTableCount(int tableCount) {
        this.tableCount = tableCount;
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(OrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
