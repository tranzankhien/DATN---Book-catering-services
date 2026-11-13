package com.banquethub.modules.payroll.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Pure calculation service for BanquetHub Payroll.
 * Enforces BR-HR-04, BR-HR-05, BR-HR-06, BR-HR-07.
 */
@Service
public class PayrollCalculationService {

    /**
     * BR-HR-04: Lương theo công = Lương cố định × Số công thực tế / Số công chuẩn.
     * Làm tròn về đồng theo HALF_UP sau phép tính phân bổ.
     */
    public BigDecimal calculateSalaryByWorkdays(BigDecimal baseSalary, BigDecimal actualWorkdays, BigDecimal standardWorkdays) {
        if (standardWorkdays == null || standardWorkdays.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số ngày công chuẩn phải lớn hơn 0");
        }
        if (baseSalary == null || baseSalary.compareTo(BigDecimal.ZERO) <= 0
                || actualWorkdays == null || actualWorkdays.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(0, RoundingMode.HALF_UP);
        }

        // To avoid premature intermediate rounding error, multiply first then divide by standardWorkdays
        return baseSalary.multiply(actualWorkdays).divide(standardWorkdays, 0, RoundingMode.HALF_UP);
    }

    /**
     * BR-HR-05: Lương thực lĩnh = Lương theo công + Tổng phụ cấp − Tổng khấu trừ.
     */
    public BigDecimal calculateNetSalary(BigDecimal calculatedSalary, BigDecimal totalAllowances, BigDecimal totalDeductions) {
        BigDecimal calc = calculatedSalary != null ? calculatedSalary : BigDecimal.ZERO;
        BigDecimal allowances = totalAllowances != null ? totalAllowances : BigDecimal.ZERO;
        BigDecimal deductions = totalDeductions != null ? totalDeductions : BigDecimal.ZERO;

        return calc.add(allowances).subtract(deductions);
    }
}
