package org.aplication.backend.common.enums;

public enum UserRole {
    CUSTOMER,
    ADMIN,
    EVENT_MANAGER,
    CHEF,
    SERVER;

    public boolean isStaff() {
        return this != CUSTOMER;
    }
}
