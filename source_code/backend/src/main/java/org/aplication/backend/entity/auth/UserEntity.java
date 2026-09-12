package org.aplication.backend.entity.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import org.aplication.backend.common.base.BaseEntity;
import org.aplication.backend.common.enums.UserRole;
import org.aplication.backend.dto.request.user.RegistrationDetailsRequest.CustomerType;

@Entity
@Table(name = "users")
public class UserEntity extends BaseEntity {
    @Column(nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true, length = 20)
    private String phone;

    @Column(nullable = false, length = 60)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserRole role;

    @Column(nullable = false)
    private boolean active = true;
    @Column(length = 500) private String address;
    @Enumerated(EnumType.STRING) @Column(length = 20) private CustomerType customerType;
    @Column(length = 200) private String companyName;

    protected UserEntity() {}

    public UserEntity(String fullName, String email, String phone, String passwordHash, UserRole role) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.passwordHash = passwordHash;
        this.role = role;
    }
    public void setCustomerDetails(String address, CustomerType customerType, String companyName) {
        this.address = address; this.customerType = customerType;
        this.companyName = customerType == CustomerType.BUSINESS ? companyName : null;
    }

    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getPasswordHash() { return passwordHash; }
    public UserRole getRole() { return role; }
    public boolean isActive() { return active; }
    public String getAddress() { return address; }
    public CustomerType getCustomerType() { return customerType; }
    public String getCompanyName() { return companyName; }
}
