package org.aplication.backend.entity.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.aplication.backend.common.base.BaseEntity;

@Entity
@Table(name = "dish_categories")
public class DishCategoryEntity extends BaseEntity {
    @Column(nullable = false, unique = true, length = 100)
    private String name;
    @Column(name = "display_order", nullable = false)
    private int displayOrder;
    @Column(nullable = false)
    private boolean active = true;

    protected DishCategoryEntity() {}
    public String getName() { return name; }
    public int getDisplayOrder() { return displayOrder; }
    public boolean isActive() { return active; }
}
