package com.banquethub.modules.attendance.dto;

import com.banquethub.modules.attendance.entity.AttendanceStatus;

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
        Map<Integer, AttendanceDto> dailyRecords,
        Map<Integer, AttendanceStatus> dailyStatusMap,
        Map<Integer, String> dailyNoteMap
) {
    public AttendanceMonthlySummaryDto(
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
        this(
                year,
                month,
                employeeId,
                employeeCode,
                employeeName,
                position,
                presentDays,
                halfDays,
                absentDays,
                totalWorkUnits,
                unrecordedDays,
                dailyRecords,
                java.util.Collections.emptyMap(),
                java.util.Collections.emptyMap()
        );
    }
}
