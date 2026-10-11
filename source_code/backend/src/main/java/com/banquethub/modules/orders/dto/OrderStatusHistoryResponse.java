package com.banquethub.modules.orders.dto;

import com.banquethub.modules.orders.entity.OrderStatus;
import com.banquethub.modules.orders.entity.OrderStatusHistory;

import java.time.OffsetDateTime;

public class OrderStatusHistoryResponse {

    private Long id;
    private OrderStatus fromStatus;
    private OrderStatus toStatus;
    private String changedByName;
    private String reason;
    private OffsetDateTime createdAt;

    public OrderStatusHistoryResponse() {}

    public static OrderStatusHistoryResponse fromEntity(OrderStatusHistory history) {
        OrderStatusHistoryResponse resp = new OrderStatusHistoryResponse();
        resp.setId(history.getId());
        resp.setFromStatus(history.getFromStatus());
        resp.setToStatus(history.getToStatus());
        resp.setChangedByName(history.getChangedByName());
        resp.setReason(history.getReason());
        resp.setCreatedAt(history.getCreatedAt());
        return resp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public OrderStatus getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(OrderStatus fromStatus) {
        this.fromStatus = fromStatus;
    }

    public OrderStatus getToStatus() {
        return toStatus;
    }

    public void setToStatus(OrderStatus toStatus) {
        this.toStatus = toStatus;
    }

    public String getChangedByName() {
        return changedByName;
    }

    public void setChangedByName(String changedByName) {
        this.changedByName = changedByName;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
