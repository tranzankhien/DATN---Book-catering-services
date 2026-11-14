package com.banquethub.modules.payroll.repository;

import com.banquethub.modules.payroll.entity.PaymentStatus;
import com.banquethub.modules.payroll.entity.Payroll;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long>, JpaSpecificationExecutor<Payroll> {

    @Query("SELECT p FROM Payroll p LEFT JOIN FETCH p.employee LEFT JOIN FETCH p.payrollPeriod WHERE p.payrollPeriod.id = :periodId ORDER BY p.employee.id ASC")
    List<Payroll> findByPayrollPeriodId(@Param("periodId") Long periodId);

    @Query("SELECT p FROM Payroll p LEFT JOIN FETCH p.employee LEFT JOIN FETCH p.payrollPeriod WHERE p.id = :id")
    Optional<Payroll> findByIdWithDetails(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payroll p WHERE p.id = :id")
    Optional<Payroll> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT p FROM Payroll p LEFT JOIN FETCH p.employee LEFT JOIN FETCH p.payrollPeriod WHERE p.employee.id = :employeeId AND p.payrollPeriod.id = :payrollPeriodId")
    Optional<Payroll> findByEmployeeIdAndPayrollPeriodId(@Param("employeeId") Long employeeId, @Param("payrollPeriodId") Long payrollPeriodId);

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN TRUE ELSE FALSE END FROM Payroll p WHERE p.employee.id = :employeeId AND p.payrollPeriod.id = :payrollPeriodId")
    boolean existsByEmployeeIdAndPayrollPeriodId(@Param("employeeId") Long employeeId, @Param("payrollPeriodId") Long payrollPeriodId);

    @Query("SELECT COUNT(p) FROM Payroll p WHERE p.payrollPeriod.id = :payrollPeriodId")
    long countByPayrollPeriodId(@Param("payrollPeriodId") Long payrollPeriodId);

    @Query("SELECT COUNT(p) FROM Payroll p WHERE p.payrollPeriod.id = :payrollPeriodId AND p.paymentStatus = :paymentStatus")
    long countByPayrollPeriodIdAndPaymentStatus(@Param("payrollPeriodId") Long payrollPeriodId, @Param("paymentStatus") PaymentStatus paymentStatus);

    @Query("SELECT p FROM Payroll p LEFT JOIN FETCH p.employee LEFT JOIN FETCH p.payrollPeriod WHERE p.employee.id = :employeeId ORDER BY p.payrollPeriod.year DESC, p.payrollPeriod.month DESC")
    List<Payroll> findByEmployeeIdOrderByPeriodDesc(@Param("employeeId") Long employeeId);

    @Query("SELECT COALESCE(SUM(p.netSalary), 0) FROM Payroll p WHERE p.payrollPeriod.id = :periodId")
    BigDecimal sumNetSalaryByPeriodId(@Param("periodId") Long periodId);

    @Query("SELECT COALESCE(SUM(p.netSalary), 0) FROM Payroll p WHERE p.payrollPeriod.id = :periodId AND p.paymentStatus = :status")
    BigDecimal sumNetSalaryByPeriodIdAndStatus(@Param("periodId") Long periodId, @Param("status") PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.calculatedSalary), 0) FROM Payroll p WHERE p.payrollPeriod.id = :periodId")
    BigDecimal sumCalculatedSalaryByPeriodId(@Param("periodId") Long periodId);

    @Query("SELECT COALESCE(SUM(p.totalAllowances), 0) FROM Payroll p WHERE p.payrollPeriod.id = :periodId")
    BigDecimal sumTotalAllowancesByPeriodId(@Param("periodId") Long periodId);

    @Query("SELECT COALESCE(SUM(p.totalDeductions), 0) FROM Payroll p WHERE p.payrollPeriod.id = :periodId")
    BigDecimal sumTotalDeductionsByPeriodId(@Param("periodId") Long periodId);

    @Query("SELECT COALESCE(SUM(p.netSalary), 0) FROM Payroll p WHERE p.paymentStatus = 'PAID'")
    BigDecimal sumAllPaidSalary();

    @Query("SELECT COALESCE(SUM(p.netSalary), 0) FROM Payroll p WHERE p.paymentStatus = 'UNPAID'")
    BigDecimal sumAllUnpaidSalary();

    @Query("SELECT COALESCE(SUM(p.netSalary), 0) FROM Payroll p")
    BigDecimal sumAllFinalizedSalary();
}
