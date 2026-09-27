package com.banquethub.modules.inventory.repository;

import com.banquethub.modules.inventory.entity.PaymentStatus;
import com.banquethub.modules.inventory.entity.StockReceipt;
import com.banquethub.modules.inventory.entity.StockReceiptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StockReceiptRepository extends JpaRepository<StockReceipt, Long> {

    @Query(value = "SELECT nextval('stock_receipt_code_seq')", nativeQuery = true)
    Long getNextReceiptCodeSeq();

    Optional<StockReceipt> findByCodeIgnoreCase(String code);

    @Query("SELECT r FROM StockReceipt r LEFT JOIN FETCH r.items i LEFT JOIN FETCH i.ingredient WHERE r.id = :id")
    Optional<StockReceipt> findWithItemsById(@Param("id") Long id);

    List<StockReceipt> findBySupplierIdOrderByReceiptDateDescIdDesc(Long supplierId);

    long countBySupplierId(Long supplierId);

    @Query("SELECT COALESCE(SUM(r.totalAmount), 0) FROM StockReceipt r WHERE r.supplier.id = :supplierId AND r.status = 'CONFIRMED'")
    BigDecimal sumConfirmedPurchasedBySupplierId(@Param("supplierId") Long supplierId);

    @Query("SELECT COALESCE(SUM(r.amountPaid), 0) FROM StockReceipt r WHERE r.supplier.id = :supplierId AND r.status = 'CONFIRMED'")
    BigDecimal sumConfirmedPaidBySupplierId(@Param("supplierId") Long supplierId);

    @Query("SELECT COALESCE(SUM(r.totalAmount), 0) FROM StockReceipt r WHERE r.status = 'CONFIRMED' AND r.receiptDate >= :fromDate AND r.receiptDate <= :toDate")
    BigDecimal sumConfirmedTotalBetweenDates(@Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);

    @Query("SELECT COALESCE(SUM(r.totalAmount), 0) FROM StockReceipt r WHERE r.status = 'CONFIRMED'")
    BigDecimal sumAllConfirmedTotal();

    @Query("SELECT COALESCE(SUM(r.amountPaid), 0) FROM StockReceipt r WHERE r.status = 'CONFIRMED'")
    BigDecimal sumAllConfirmedPaid();

    @Query("SELECT r FROM StockReceipt r WHERE " +
           "(:supplierId IS NULL OR r.supplier.id = :supplierId) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:paymentStatus IS NULL OR r.paymentStatus = :paymentStatus) " +
           "AND (:fromDate IS NULL OR r.receiptDate >= :fromDate) " +
           "AND (:toDate IS NULL OR r.receiptDate <= :toDate) " +
           "ORDER BY r.receiptDate DESC, r.id DESC")
    List<StockReceipt> findWithFilters(
            @Param("supplierId") Long supplierId,
            @Param("status") StockReceiptStatus status,
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );
}
