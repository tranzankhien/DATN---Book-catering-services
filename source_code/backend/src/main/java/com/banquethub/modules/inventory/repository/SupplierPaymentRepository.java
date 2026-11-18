package com.banquethub.modules.inventory.repository;

import com.banquethub.modules.inventory.entity.SupplierPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface SupplierPaymentRepository extends JpaRepository<SupplierPayment, Long> {

    List<SupplierPayment> findByStockReceiptId(Long stockReceiptId);

    List<SupplierPayment> findBySupplierId(Long supplierId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM SupplierPayment p " +
           "WHERE p.paymentDate >= :startDate AND p.paymentDate < :endDate")
    BigDecimal sumAmountByPaymentDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM SupplierPayment p")
    BigDecimal sumTotalPaid();
}
