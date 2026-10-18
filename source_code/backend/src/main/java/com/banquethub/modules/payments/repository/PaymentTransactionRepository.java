package com.banquethub.modules.payments.repository;
import com.banquethub.modules.payments.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.*;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction,Long> {
    Optional<PaymentTransaction> findByTransactionReference(String reference);
    List<PaymentTransaction> findByOrderIdOrderByCreatedAtDesc(Long orderId);
    boolean existsByOrderIdAndStatus(Long orderId, String status);
    boolean existsByOrderIdAndStatusAndExpiresAtAfter(Long orderId, String status, java.time.OffsetDateTime now);
    Optional<PaymentTransaction> findFirstByOrderIdAndStatusOrderByCreatedAtDesc(Long orderId,String status);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select p from PaymentTransaction p where p.id=:id")
    Optional<PaymentTransaction> lockById(@Param("id") Long id);
    @Query("select p from PaymentTransaction p where (:status is null or p.status=:status)")
    Page<PaymentTransaction> search(@Param("status") String status,Pageable pageable);
}
