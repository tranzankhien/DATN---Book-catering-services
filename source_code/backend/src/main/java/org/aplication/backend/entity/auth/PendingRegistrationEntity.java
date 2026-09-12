package org.aplication.backend.entity.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import org.aplication.backend.common.base.BaseEntity;
import org.aplication.backend.dto.request.user.RegistrationDetailsRequest.CustomerType;

@Entity
@Table(name = "pending_registrations")
public class PendingRegistrationEntity extends BaseEntity {
    @Column(nullable = false, length = 120) private String fullName;
    @Column(nullable = false, length = 255) private String email;
    @Column(nullable = false, length = 20) private String phone;
    @Column(nullable = false, length = 60) private String passwordHash;
    @Column(length = 500) private String address;
    @Enumerated(EnumType.STRING) @Column(length = 20) private CustomerType customerType;
    @Column(length = 200) private String companyName;
    @Column(nullable = false) private Instant expiresAt;

    protected PendingRegistrationEntity() {}

    public PendingRegistrationEntity(String fullName, String email, String phone, String passwordHash, Instant expiresAt) {
        this.fullName = fullName; this.email = email; this.phone = phone;
        this.passwordHash = passwordHash; this.expiresAt = expiresAt;
    }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getPasswordHash() { return passwordHash; }
    public String getAddress() { return address; }
    public CustomerType getCustomerType() { return customerType; }
    public String getCompanyName() { return companyName; }
    public Instant getExpiresAt() { return expiresAt; }
    public boolean expired() { return !expiresAt.isAfter(Instant.now()); }
    public void details(String address, CustomerType customerType, String companyName) {
        this.address = address; this.customerType = customerType;
        this.companyName = customerType == CustomerType.BUSINESS ? companyName : null;
    }
}
