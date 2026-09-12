package org.aplication.backend.entity.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import org.aplication.backend.common.base.BaseEntity;

@Entity
@Table(name = "additional_services")
public class AdditionalServiceEntity extends BaseEntity {
    @Column(nullable = false, length = 160)
    private String name;
    @Column(columnDefinition = "text")
    private String description;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal price;
    @Column(name = "pricing_unit", nullable = false, length = 20)
    private String pricingUnit;
    @Column(nullable = false)
    private boolean active = true;

    protected AdditionalServiceEntity() {}
    public String getName() { return name; }
    public String getDescription() { return description; }
    public BigDecimal getPrice() { return price; }
    public String getPricingUnit() { return pricingUnit; }
    public boolean isActive() { return active; }
}
