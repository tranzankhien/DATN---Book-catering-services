package com.banquethub.modules.expenses.repository;

import com.banquethub.modules.expenses.entity.ExpenseCategory;
import com.banquethub.modules.expenses.entity.ExpensePaymentStatus;
import com.banquethub.modules.expenses.entity.OperatingExpense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface OperatingExpenseRepository extends JpaRepository<OperatingExpense, Long>, JpaSpecificationExecutor<OperatingExpense> {

    Optional<OperatingExpense> findByExpenseCode(String expenseCode);

    boolean existsByExpenseCode(String expenseCode);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM OperatingExpense e " +
           "WHERE e.incurredDate >= :startDate AND e.incurredDate < :endDate")
    BigDecimal sumAmountByIncurredDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM OperatingExpense e " +
           "WHERE e.paymentStatus = 'PAID' AND e.paidAt >= :startDateTime AND e.paidAt < :endDateTime")
    BigDecimal sumPaidAmountByPaidAtBetween(@Param("startDateTime") OffsetDateTime startDateTime, @Param("endDateTime") OffsetDateTime endDateTime);

    @Query("SELECT e.category, COALESCE(SUM(e.amount), 0) FROM OperatingExpense e " +
           "WHERE e.incurredDate >= :startDate AND e.incurredDate < :endDate " +
           "GROUP BY e.category")
    List<Object[]> sumAmountGroupByCategory(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM OperatingExpense e " +
           "WHERE e.paymentStatus = 'UNPAID'")
    BigDecimal sumTotalUnpaidAmount();
}
