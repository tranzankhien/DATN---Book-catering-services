package com.banquethub.modules.orders.dto;

import com.banquethub.modules.orders.entity.Order;
import com.banquethub.modules.orders.entity.OrderStatus;
import com.banquethub.modules.orders.entity.PaymentStatus;
import com.banquethub.modules.reservations.dto.StockReservationResponse;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;

public class OrderResponse {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private Long id;
    private String orderCode;
    private Long userId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String contactName;
    private String contactPhone;
    private OffsetDateTime eventDateTime;
    private Integer tableCount;
    private String note;
    private String eventLocation;

    private BigDecimal eventLatitude;

    private BigDecimal eventLongitude;
    private Integer guestCount;
    private Long menuId;
    private String menuNameSnapshot;
    private BigDecimal totalAmount;
    private OrderStatus orderStatus;
    private PaymentStatus paymentStatus;
    private OffsetDateTime paymentExpiresAt;
    private Long secondsRemaining;
    private List<OrderItemResponse> items;
    private StockReservationResponse reservation;
    private List<OrderStatusHistoryResponse> statusHistories;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public OrderResponse() {}

    public static OrderResponse fromEntity(Order order) {
        OrderResponse resp = new OrderResponse();
        resp.setId(order.getId());
        resp.setOrderCode(order.getOrderCode());
        if (order.getUser() != null) {
            resp.setUserId(order.getUser().getId());
        }
        resp.setCustomerName(order.getCustomerName());
        resp.setCustomerPhone(order.getCustomerPhone());
        resp.setCustomerEmail(order.getCustomerEmail());
        resp.setContactName(order.getContactName());
        resp.setContactPhone(order.getContactPhone());
        resp.setEventDateTime(order.getEventDateTime());
        resp.setTableCount(order.getTableCount());
        resp.setNote(order.getNote());
        resp.setEventLocation(order.getEventLocation());
        resp.setEventLatitude(order.getEventLatitude());
        resp.setEventLongitude(order.getEventLongitude());
        resp.setGuestCount(order.getGuestCount());
        if (order.getMenu() != null) {
            resp.setMenuId(order.getMenu().getId());
        }
        resp.setMenuNameSnapshot(order.getMenuNameSnapshot());
        resp.setTotalAmount(order.getTotalAmount());
        resp.setOrderStatus(order.getOrderStatus());
        resp.setPaymentStatus(order.getPaymentStatus());
        resp.setPaymentExpiresAt(order.getPaymentExpiresAt());

        // Calculate seconds remaining for 15m countdown (BR-07)
        if (order.getOrderStatus() == OrderStatus.PENDING_PAYMENT && order.getPaymentExpiresAt() != null) {
            OffsetDateTime now = OffsetDateTime.now(VN_ZONE);
            if (now.isBefore(order.getPaymentExpiresAt())) {
                resp.setSecondsRemaining(Duration.between(now, order.getPaymentExpiresAt()).getSeconds());
            } else {
                resp.setSecondsRemaining(0L);
            }
        } else {
            resp.setSecondsRemaining(0L);
        }

        if (order.getItems() != null) {
            resp.setItems(order.getItems().stream()
                    .map(OrderItemResponse::fromEntity)
                    .toList());
        } else {
            resp.setItems(Collections.emptyList());
        }

        if (order.getStatusHistories() != null) {
            resp.setStatusHistories(order.getStatusHistories().stream()
                    .map(OrderStatusHistoryResponse::fromEntity)
                    .toList());
        } else {
            resp.setStatusHistories(Collections.emptyList());
        }

        resp.setCreatedAt(order.getCreatedAt());
        resp.setUpdatedAt(order.getUpdatedAt());
        return resp;
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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public OffsetDateTime getEventDateTime() {
        return eventDateTime;
    }

    public void setEventDateTime(OffsetDateTime eventDateTime) {
        this.eventDateTime = eventDateTime;
    }

    public Integer getTableCount() {
        return tableCount;
    }

    public void setTableCount(Integer tableCount) {
        this.tableCount = tableCount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public BigDecimal getEventLatitude() { return eventLatitude; }

    public void setEventLatitude(BigDecimal value) { this.eventLatitude = value; }

    public BigDecimal getEventLongitude() { return eventLongitude; }

    public void setEventLongitude(BigDecimal value) { this.eventLongitude = value; }

    public String getEventLocation() {
        return eventLocation;
    }

    public void setEventLocation(String eventLocation) {
        this.eventLocation = eventLocation;
    }

    public Integer getGuestCount() {
        return guestCount;
    }

    public void setGuestCount(Integer guestCount) {
        this.guestCount = guestCount;
    }

    public Long getMenuId() {
        return menuId;
    }

    public void setMenuId(Long menuId) {
        this.menuId = menuId;
    }

    public String getMenuNameSnapshot() {
        return menuNameSnapshot;
    }

    public void setMenuNameSnapshot(String menuNameSnapshot) {
        this.menuNameSnapshot = menuNameSnapshot;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(OrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public OffsetDateTime getPaymentExpiresAt() {
        return paymentExpiresAt;
    }

    public void setPaymentExpiresAt(OffsetDateTime paymentExpiresAt) {
        this.paymentExpiresAt = paymentExpiresAt;
    }

    public Long getSecondsRemaining() {
        return secondsRemaining;
    }

    public void setSecondsRemaining(Long secondsRemaining) {
        this.secondsRemaining = secondsRemaining;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }

    public void setItems(List<OrderItemResponse> items) {
        this.items = items;
    }

    public StockReservationResponse getReservation() {
        return reservation;
    }

    public void setReservation(StockReservationResponse reservation) {
        this.reservation = reservation;
    }

    public List<OrderStatusHistoryResponse> getStatusHistories() {
        return statusHistories;
    }

    public void setStatusHistories(List<OrderStatusHistoryResponse> statusHistories) {
        this.statusHistories = statusHistories;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
