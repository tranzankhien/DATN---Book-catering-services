package com.banquethub.modules.payroll.repository;

import com.banquethub.modules.payroll.entity.SalaryPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryPaymentRepository extends JpaRepository<SalaryPayment, Long> {

    @Query("SELECT sp FROM SalaryPayment sp LEFT JOIN FETCH sp.payroll p LEFT JOIN FETCH p.employee LEFT JOIN FETCH p.payrollPeriod WHERE sp.payroll.id = :payrollId")
    Optional<SalaryPayment> findByPayrollId(@Param("payrollId") Long payrollId);

    @Query("SELECT CASE WHEN COUNT(sp) > 0 THEN TRUE ELSE FALSE END FROM SalaryPayment sp WHERE sp.payroll.id = :payrollId")
    boolean existsByPayrollId(@Param("payrollId") Long payrollId);

    @Query("SELECT sp FROM SalaryPayment sp LEFT JOIN FETCH sp.payroll p LEFT JOIN FETCH p.employee LEFT JOIN FETCH p.payrollPeriod ORDER BY sp.paymentDate DESC, sp.id DESC")
    List<SalaryPayment> findAllWithDetails();

    @Query("SELECT COALESCE(SUM(sp.amount), 0) FROM SalaryPayment sp")
    BigDecimal sumTotalPaid();
}
