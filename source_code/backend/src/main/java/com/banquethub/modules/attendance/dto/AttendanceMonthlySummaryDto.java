package com.banquethub.modules.attendance.dto;

import java.math.BigDecimal;
import java.util.Map;

public record AttendanceMonthlySummaryDto(
        int year,
        int month,
        Long employeeId,
        String employeeCode,
        String employeeName,
        String position,
        int presentDays,
        int halfDays,
        int absentDays,
        BigDecimal totalWorkUnits,
        int unrecordedDays,
        Map<Integer, AttendanceDto> dailyRecords
) {
}
