package com.banquethub.modules.payroll.dto;

import java.math.BigDecimal;
import java.util.List;

public record PayrollSummaryDto(
        Integer year,
        Integer month,
        BigDecimal totalFinalizedPayrollAmount, // Chi phí lương theo kỳ (thực lĩnh đã chốt)
        BigDecimal totalPaidAmount,             // Dòng tiền lương đã chi thực tế
        BigDecimal totalUnpaidAmount,           // Lương còn phải trả
        BigDecimal totalCalculatedSalary,       // Tổng lương theo ngày công
        BigDecimal totalAllowances,             // Tổng phụ cấp
        BigDecimal totalDeductions,             // Tổng khấu trừ
        long activeEmployeesCount,              // Tổng số nhân viên đang hoạt động
        BigDecimal totalRecordedWorkdays,       // Tổng số công ghi nhận trong kỳ
        List<MonthlyPayrollMetricDto> monthlyMetrics
) {
    public record MonthlyPayrollMetricDto(
            int year,
            int month,
            String periodName,
            BigDecimal finalizedAmount,
            BigDecimal paidAmount,
            BigDecimal unpaidAmount,
            String status
    ) {
    }
}
