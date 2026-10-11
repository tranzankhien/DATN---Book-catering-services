package com.banquethub.modules.reservations.entity;

import com.banquethub.modules.catalog.entity.Ingredient;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Entity
@Table(name = "stock_reservation_items")
public class StockReservationItem {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id", nullable = false)
    private StockReservation reservation;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(name = "reserved_quantity", nullable = false, precision = 12, scale = 3)
    private BigDecimal reservedQuantity;

    @Column(name = "unit", nullable = false, length = 30)
    private String unit;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public StockReservationItem() {}

    public StockReservationItem(StockReservation reservation, Ingredient ingredient, BigDecimal reservedQuantity, String unit) {
        this.reservation = reservation;
        this.ingredient = ingredient;
        this.reservedQuantity = reservedQuantity;
        this.unit = unit != null ? unit : (ingredient != null ? ingredient.getUnit() : "");
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = OffsetDateTime.now(VN_ZONE);
        if (this.unit == null && this.ingredient != null) {
            this.unit = this.ingredient.getUnit();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public StockReservation getReservation() {
        return reservation;
    }

    public void setReservation(StockReservation reservation) {
        this.reservation = reservation;
    }

    public Ingredient getIngredient() {
        return ingredient;
    }

    public void setIngredient(Ingredient ingredient) {
        this.ingredient = ingredient;
    }

    public BigDecimal getReservedQuantity() {
        return reservedQuantity;
    }

    public void setReservedQuantity(BigDecimal reservedQuantity) {
        this.reservedQuantity = reservedQuantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
