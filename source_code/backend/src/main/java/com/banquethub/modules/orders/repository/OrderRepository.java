package com.banquethub.modules.orders.repository;

import com.banquethub.modules.orders.entity.Order;
import com.banquethub.modules.orders.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    Optional<Order> findByOrderCodeIgnoreCase(String orderCode);

    boolean existsByOrderCodeIgnoreCase(String orderCode);

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    @Query(value = "SELECT nextval('order_code_seq')", nativeQuery = true)
    Long getNextOrderCodeSeq();

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Order> findByOrderStatusAndPaymentExpiresAtBefore(OrderStatus status, OffsetDateTime time);

    @Query("SELECT o FROM Order o WHERE " +
           "(:userId IS NULL OR o.user.id = :userId) " +
           "AND (:status IS NULL OR o.orderStatus = :status) " +
           "ORDER BY o.createdAt DESC")
    Page<Order> findUserOrders(
            @Param("userId") Long userId,
            @Param("status") OrderStatus status,
            Pageable pageable
    );
}
