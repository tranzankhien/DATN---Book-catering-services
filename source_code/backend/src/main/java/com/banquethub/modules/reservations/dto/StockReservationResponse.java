package com.banquethub.modules.reservations.dto;

import com.banquethub.modules.reservations.entity.ReservationStatus;
import com.banquethub.modules.reservations.entity.StockReservation;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;

public class StockReservationResponse {

    private Long id;
    private Long orderId;
    private String orderCode;
    private String customerName;
    private ReservationStatus status;
    private OffsetDateTime expiresAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime releasedAt;
    private List<StockReservationItemResponse> items;

    public StockReservationResponse() {}

    public static StockReservationResponse fromEntity(StockReservation res) {
        StockReservationResponse resp = new StockReservationResponse();
        resp.setId(res.getId());
        if (res.getOrder() != null) {
            resp.setOrderId(res.getOrder().getId());
            resp.setOrderCode(res.getOrder().getOrderCode());
            resp.setCustomerName(res.getOrder().getCustomerName());
        }
        resp.setStatus(res.getStatus());
        resp.setExpiresAt(res.getExpiresAt());
        resp.setCreatedAt(res.getCreatedAt());
        resp.setReleasedAt(res.getReleasedAt());
        if (res.getItems() != null) {
            resp.setItems(res.getItems().stream()
                    .map(StockReservationItemResponse::fromEntity)
                    .toList());
        } else {
            resp.setItems(Collections.emptyList());
        }
        return resp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ReservationStatus status) {
        this.status = status;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(OffsetDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getReleasedAt() {
        return releasedAt;
    }

    public void setReleasedAt(OffsetDateTime releasedAt) {
        this.releasedAt = releasedAt;
    }

    public List<StockReservationItemResponse> getItems() {
        return items;
    }

    public void setItems(List<StockReservationItemResponse> items) {
        this.items = items;
    }
}
