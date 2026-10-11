package com.banquethub.modules.reservations.entity;

import com.banquethub.modules.orders.entity.Order;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "stock_reservations")
public class StockReservation {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReservationStatus status = ReservationStatus.ACTIVE;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "released_at")
    private OffsetDateTime releasedAt;

    @OneToMany(mappedBy = "reservation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StockReservationItem> items = new ArrayList<>();

    public StockReservation() {}

    public StockReservation(Order order, OffsetDateTime expiresAt) {
        this.order = order;
        this.expiresAt = expiresAt;
        this.status = ReservationStatus.ACTIVE;
    }

    @PrePersist
    public void prePersist() {
        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);
        this.createdAt = now;
        if (this.status == null) {
            this.status = ReservationStatus.ACTIVE;
        }
        if (this.expiresAt == null) {
            this.expiresAt = now.plusMinutes(15);
        }
    }

    public void addItem(StockReservationItem item) {
        items.add(item);
        item.setReservation(this);
    }

    public boolean isActive() {
        return this.status == ReservationStatus.ACTIVE
                && this.expiresAt != null
                && OffsetDateTime.now(VN_ZONE).isBefore(this.expiresAt);
    }

    public void release() {
        this.status = ReservationStatus.RELEASED;
        this.releasedAt = OffsetDateTime.now(VN_ZONE);
    }

    public void expire() {
        this.status = ReservationStatus.EXPIRED;
        this.releasedAt = OffsetDateTime.now(VN_ZONE);
    }

    public void fulfill() {
        this.status = ReservationStatus.FULFILLED;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
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

    public List<StockReservationItem> getItems() {
        return items;
    }

    public void setItems(List<StockReservationItem> items) {
        this.items = items;
    }
}
