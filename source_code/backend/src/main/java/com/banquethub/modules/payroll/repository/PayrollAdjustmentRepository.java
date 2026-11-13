package com.banquethub.modules.payroll.repository;

import com.banquethub.modules.payroll.entity.AdjustmentType;
import com.banquethub.modules.payroll.entity.PayrollAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PayrollAdjustmentRepository extends JpaRepository<PayrollAdjustment, Long> {

    @Query("SELECT a FROM PayrollAdjustment a LEFT JOIN FETCH a.employee LEFT JOIN FETCH a.payrollPeriod WHERE a.payrollPeriod.id = :periodId ORDER BY a.employee.id ASC, a.id ASC")
    List<PayrollAdjustment> findByPayrollPeriodId(@Param("periodId") Long periodId);

    @Query("SELECT a FROM PayrollAdjustment a LEFT JOIN FETCH a.employee LEFT JOIN FETCH a.payrollPeriod WHERE a.payrollPeriod.id = :periodId AND a.employee.id = :employeeId ORDER BY a.id ASC")
    List<PayrollAdjustment> findByPayrollPeriodIdAndEmployeeId(@Param("periodId") Long periodId, @Param("employeeId") Long employeeId);

    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM PayrollAdjustment a WHERE a.payrollPeriod.id = :periodId AND a.employee.id = :employeeId AND a.adjustmentType = :type")
    BigDecimal sumAmountByPeriodIdAndEmployeeIdAndType(
            @Param("periodId") Long periodId,
            @Param("employeeId") Long employeeId,
            @Param("type") AdjustmentType type
    );
}
