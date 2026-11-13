package com.banquethub.modules.attendance.dto;

import com.banquethub.modules.attendance.entity.Attendance;
import com.banquethub.modules.attendance.entity.AttendanceStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record AttendanceDto(
        Long id,
        Long employeeId,
        String employeeCode,
        String employeeName,
        LocalDate workDate,
        AttendanceStatus attendanceStatus,
        BigDecimal workUnits,
        String note,
        String createdBy,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static AttendanceDto fromEntity(Attendance a) {
        if (a == null) return null;
        return new AttendanceDto(
                a.getId(),
                a.getEmployee() != null ? a.getEmployee().getId() : null,
                a.getEmployee() != null ? a.getEmployee().getEmployeeCode() : null,
                a.getEmployee() != null ? a.getEmployee().getFullName() : null,
                a.getWorkDate(),
                a.getAttendanceStatus(),
                a.getWorkUnits(),
                a.getNote(),
                a.getCreatedBy(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
