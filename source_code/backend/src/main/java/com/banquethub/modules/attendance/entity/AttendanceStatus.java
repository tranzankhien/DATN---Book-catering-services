package com.banquethub.modules.attendance.entity;

import java.math.BigDecimal;

public enum AttendanceStatus {
    PRESENT(new BigDecimal("1.0")),
    HALF_DAY(new BigDecimal("0.5")),
    ABSENT(new BigDecimal("0.0"));

    private final BigDecimal workUnits;

    AttendanceStatus(BigDecimal workUnits) {
        this.workUnits = workUnits;
    }

    public BigDecimal getWorkUnits() {
        return workUnits;
    }
}
