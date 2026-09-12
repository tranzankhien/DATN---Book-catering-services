package org.aplication.backend.entity.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import org.aplication.backend.common.base.BaseEntity;

@Entity
@Table(name = "dishes")
public class DishEntity extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private DishCategoryEntity category;
    @Column(nullable = false, length = 160)
    private String name;
    @Column(columnDefinition = "text")
    private String description;
    @Column(name = "image_url", columnDefinition = "text")
    private String imageUrl;
    @Column(name = "sale_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal salePrice;
    @Column(name = "serving_unit", nullable = false, length = 30)
    private String servingUnit;
    @Column(nullable = false)
    private boolean active = true;

    protected DishEntity() {}
    public DishCategoryEntity getCategory() { return category; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public BigDecimal getSalePrice() { return salePrice; }
    public String getServingUnit() { return servingUnit; }
    public boolean isActive() { return active; }
}
