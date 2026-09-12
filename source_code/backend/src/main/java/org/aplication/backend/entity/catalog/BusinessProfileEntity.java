package org.aplication.backend.entity.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.aplication.backend.common.base.BaseEntity;

@Entity
@Table(name = "business_profile")
public class BusinessProfileEntity extends BaseEntity {
    @Column(nullable = false, length = 200)
    private String name;
    @Column(nullable = false, length = 20)
    private String phone;
    @Column(length = 255)
    private String email;
    @Column(nullable = false, columnDefinition = "text")
    private String address;
    @Column(columnDefinition = "text")
    private String description;
    @Column(name = "image_url", columnDefinition = "text")
    private String imageUrl;
    @Column(name = "service_radius_km", nullable = false)
    private int serviceRadiusKm;

    protected BusinessProfileEntity() {}

    public BusinessProfileEntity(String name, String phone, String email, String address,
                                 String description, String imageUrl, int serviceRadiusKm) {
        this.name = name; this.phone = phone; this.email = email; this.address = address;
        this.description = description; this.imageUrl = imageUrl; this.serviceRadiusKm = serviceRadiusKm;
    }
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public String getAddress() { return address; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public int getServiceRadiusKm() { return serviceRadiusKm; }
}
