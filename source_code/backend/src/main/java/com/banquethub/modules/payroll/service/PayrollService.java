package com.banquethub.modules.payroll.service;

import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.attendance.repository.AttendanceRepository;
import com.banquethub.modules.employees.entity.EmployeeStatus;
import com.banquethub.modules.employees.repository.EmployeeRepository;
import com.banquethub.modules.payroll.dto.PayrollAdjustmentDto;
import com.banquethub.modules.payroll.dto.PayrollDto;
import com.banquethub.modules.payroll.dto.PayrollSummaryDto;
import com.banquethub.modules.payroll.dto.SalaryPaymentDto;
import com.banquethub.modules.payroll.entity.PaymentStatus;
import com.banquethub.modules.payroll.entity.Payroll;
import com.banquethub.modules.payroll.entity.PayrollPeriod;
import com.banquethub.modules.payroll.entity.SalaryPayment;
import com.banquethub.modules.payroll.repository.PayrollAdjustmentRepository;
import com.banquethub.modules.payroll.repository.PayrollPeriodRepository;
import com.banquethub.modules.payroll.repository.PayrollRepository;
import com.banquethub.modules.payroll.repository.SalaryPaymentRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
@Transactional
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final PayrollPeriodRepository periodRepository;
    private final PayrollAdjustmentRepository adjustmentRepository;
    private final SalaryPaymentRepository salaryPaymentRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;

    public PayrollService(
            PayrollRepository payrollRepository,
            PayrollPeriodRepository periodRepository,
            PayrollAdjustmentRepository adjustmentRepository,
            SalaryPaymentRepository salaryPaymentRepository,
            EmployeeRepository employeeRepository,
            AttendanceRepository attendanceRepository
    ) {
        this.payrollRepository = payrollRepository;
        this.periodRepository = periodRepository;
        this.adjustmentRepository = adjustmentRepository;
        this.salaryPaymentRepository = salaryPaymentRepository;
        this.employeeRepository = employeeRepository;
        this.attendanceRepository = attendanceRepository;
    }

    @Transactional(readOnly = true)
    public Page<PayrollDto> getPayrolls(
            Long payrollPeriodId,
            Integer year,
            Integer month,
            PaymentStatus paymentStatus,
            String search,
            Pageable pageable
    ) {
        Specification<Payroll> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (payrollPeriodId != null) {
                predicates.add(cb.equal(root.get("payrollPeriod").get("id"), payrollPeriodId));
            }

            if (year != null) {
                predicates.add(cb.equal(root.get("payrollPeriod").get("year"), year));
            }

            if (month != null) {
                predicates.add(cb.equal(root.get("payrollPeriod").get("month"), month));
            }

            if (paymentStatus != null) {
                predicates.add(cb.equal(root.get("paymentStatus"), paymentStatus));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("employeeCodeSnapshot")), pattern);
                Predicate nameMatch = cb.like(cb.lower(root.get("employeeNameSnapshot")), pattern);
                predicates.add(cb.or(codeMatch, nameMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return payrollRepository.findAll(spec, pageable).map(p -> {
            SalaryPaymentDto payment = salaryPaymentRepository.findByPayrollId(p.getId())
                    .map(SalaryPaymentDto::fromEntity)
                    .orElse(null);
            List<PayrollAdjustmentDto> adjustments = adjustmentRepository
                    .findByPayrollPeriodIdAndEmployeeId(p.getPayrollPeriod().getId(), p.getEmployee().getId())
                    .stream()
                    .map(PayrollAdjustmentDto::fromEntity)
                    .toList();
            return PayrollDto.fromEntity(p, payment, adjustments);
        });
    }

    @Transactional(readOnly = true)
    public PayrollDto getPayrollById(Long id) {
        Payroll payroll = payrollRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bảng lương với ID: " + id));

        SalaryPaymentDto payment = salaryPaymentRepository.findByPayrollId(payroll.getId())
                .map(SalaryPaymentDto::fromEntity)
                .orElse(null);

        List<PayrollAdjustmentDto> adjustments = adjustmentRepository
                .findByPayrollPeriodIdAndEmployeeId(payroll.getPayrollPeriod().getId(), payroll.getEmployee().getId())
                .stream()
                .map(PayrollAdjustmentDto::fromEntity)
                .toList();

        return PayrollDto.fromEntity(payroll, payment, adjustments);
    }

    @Transactional(readOnly = true)
    public List<PayrollDto> getPayrollsByEmployeeId(Long employeeId) {
        return payrollRepository.findByEmployeeIdOrderByPeriodDesc(employeeId)
                .stream()
                .map(p -> {
                    SalaryPaymentDto payment = salaryPaymentRepository.findByPayrollId(p.getId())
                            .map(SalaryPaymentDto::fromEntity)
                            .orElse(null);
                    List<PayrollAdjustmentDto> adjustments = adjustmentRepository
                            .findByPayrollPeriodIdAndEmployeeId(p.getPayrollPeriod().getId(), p.getEmployee().getId())
                            .stream()
                            .map(PayrollAdjustmentDto::fromEntity)
                            .toList();
                    return PayrollDto.fromEntity(p, payment, adjustments);
                })
                .toList();
    }

    /**
     * Serves Section XV (Integration for Phase 7 Dashboard).
     * Accurately distinguishes between:
     * - Chi phí lương theo kỳ (finalized net_salary)
     * - Dòng tiền lương đã chi (recorded salary payments)
     * - Lương còn phải trả (unpaid finalized salary)
     */
    @Transactional(readOnly = true)
    public PayrollSummaryDto getPayrollSummary(Integer year, Integer month) {
        BigDecimal totalFinalized;
        BigDecimal totalPaid;
        BigDecimal totalUnpaid;
        BigDecimal totalCalc;
        BigDecimal totalAllowances;
        BigDecimal totalDeductions;
        BigDecimal totalWorkdays;

        if (year != null && month != null) {
            Optional<PayrollPeriod> periodOpt = periodRepository.findByYearAndMonth(year, month);
            if (periodOpt.isPresent()) {
                Long periodId = periodOpt.get().getId();
                totalFinalized = payrollRepository.sumNetSalaryByPeriodId(periodId);
                totalPaid = payrollRepository.sumNetSalaryByPeriodIdAndStatus(periodId, PaymentStatus.PAID);
                totalUnpaid = payrollRepository.sumNetSalaryByPeriodIdAndStatus(periodId, PaymentStatus.UNPAID);
                totalCalc = payrollRepository.sumCalculatedSalaryByPeriodId(periodId);
                totalAllowances = payrollRepository.sumTotalAllowancesByPeriodId(periodId);
                totalDeductions = payrollRepository.sumTotalDeductionsByPeriodId(periodId);
            } else {
                totalFinalized = BigDecimal.ZERO;
                totalPaid = BigDecimal.ZERO;
                totalUnpaid = BigDecimal.ZERO;
                totalCalc = BigDecimal.ZERO;
                totalAllowances = BigDecimal.ZERO;
                totalDeductions = BigDecimal.ZERO;
            }

            YearMonth ym = YearMonth.of(year, month);
            totalWorkdays = attendanceRepository.findByWorkDateBetweenOrderByWorkDateAsc(ym.atDay(1), ym.atEndOfMonth())
                    .stream()
                    .map(a -> a.getWorkUnits() != null ? a.getWorkUnits() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

        } else {
            totalFinalized = payrollRepository.sumAllFinalizedSalary();
            totalPaid = payrollRepository.sumAllPaidSalary();
            totalUnpaid = payrollRepository.sumAllUnpaidSalary();
            totalCalc = BigDecimal.ZERO;
            totalAllowances = BigDecimal.ZERO;
            totalDeductions = BigDecimal.ZERO;
            totalWorkdays = BigDecimal.ZERO;
        }

        long activeEmployees = employeeRepository.countByStatus(EmployeeStatus.ACTIVE);

        // Monthly trend for past 6 periods
        List<PayrollPeriod> recentPeriods = periodRepository.findAllByOrderByYearDescMonthDesc();
        List<PayrollSummaryDto.MonthlyPayrollMetricDto> monthlyMetrics = recentPeriods.stream().limit(12).map(p -> {
            BigDecimal fin = payrollRepository.sumNetSalaryByPeriodId(p.getId());
            BigDecimal paid = payrollRepository.sumNetSalaryByPeriodIdAndStatus(p.getId(), PaymentStatus.PAID);
            BigDecimal unp = payrollRepository.sumNetSalaryByPeriodIdAndStatus(p.getId(), PaymentStatus.UNPAID);
            return new PayrollSummaryDto.MonthlyPayrollMetricDto(
                    p.getYear(),
                    p.getMonth(),
                    String.format("Tháng %02d/%d", p.getMonth(), p.getYear()),
                    fin,
                    paid,
                    unp,
                    p.getStatus().name()
            );
        }).toList();

        return new PayrollSummaryDto(
                year,
                month,
                totalFinalized,
                totalPaid,
                totalUnpaid,
                totalCalc,
                totalAllowances,
                totalDeductions,
                activeEmployees,
                totalWorkdays,
                monthlyMetrics
        );
    }
}
