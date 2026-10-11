package com.banquethub.modules.menus.entity;

import com.banquethub.modules.catalog.entity.Dish;
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
@Table(name = "menu_items")
public class MenuItem {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "menu_id", nullable = false)
    private Menu menu;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "dish_id", nullable = false)
    private Dish dish;

    @Column(name = "quantity_per_table", nullable = false)
    private Integer quantityPerTable = 1;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public MenuItem() {}

    public MenuItem(Menu menu, Dish dish, Integer quantityPerTable, Integer displayOrder) {
        this.menu = menu;
        this.dish = dish;
        this.quantityPerTable = quantityPerTable != null ? quantityPerTable : 1;
        this.displayOrder = displayOrder != null ? displayOrder : 0;
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = OffsetDateTime.now(VN_ZONE);
        if (this.quantityPerTable == null || this.quantityPerTable <= 0) {
            this.quantityPerTable = 1;
        }
        if (this.displayOrder == null) {
            this.displayOrder = 0;
        }
    }

    public BigDecimal calculateLineTotalPerTable() {
        if (dish == null || dish.getPrice() == null) {
            return BigDecimal.ZERO;
        }
        return dish.getPrice().multiply(BigDecimal.valueOf(quantityPerTable));
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Menu getMenu() {
        return menu;
    }

    public void setMenu(Menu menu) {
        this.menu = menu;
    }

    public Dish getDish() {
        return dish;
    }

    public void setDish(Dish dish) {
        this.dish = dish;
    }

    public Integer getQuantityPerTable() {
        return quantityPerTable;
    }

    public void setQuantityPerTable(Integer quantityPerTable) {
        this.quantityPerTable = quantityPerTable;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
