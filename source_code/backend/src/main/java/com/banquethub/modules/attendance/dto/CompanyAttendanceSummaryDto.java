package com.banquethub.modules.attendance.dto;

import java.math.BigDecimal;
import java.util.List;

public record CompanyAttendanceSummaryDto(
        int year,
        int month,
        int totalDaysInMonth,
        int totalEmployees,
        int totalRecordedRecords,
        BigDecimal totalCompanyWorkUnits,
        List<AttendanceMonthlySummaryDto> employeeSummaries
) {
}
