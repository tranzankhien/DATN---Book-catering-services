package org.aplication.backend.entity.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.aplication.backend.common.base.BaseEntity;

@Entity
@Table(name = "halls")
public class HallEntity extends BaseEntity {
    @Column(nullable = false, unique = true, length = 120)
    private String name;
    @Column(name = "capacity_min", nullable = false)
    private int capacityMin;
    @Column(name = "capacity_max", nullable = false)
    private int capacityMax;
    @Column(columnDefinition = "text")
    private String description;
    @Column(name = "image_url", columnDefinition = "text")
    private String imageUrl;
    @Column(nullable = false)
    private boolean active = true;

    protected HallEntity() {}
    public String getName() { return name; }
    public int getCapacityMin() { return capacityMin; }
    public int getCapacityMax() { return capacityMax; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public boolean isActive() { return active; }
}
