package org.aplication.backend.repository.order;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.aplication.backend.common.enums.OrderStatus;
import org.aplication.backend.entity.order.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {
    List<OrderEntity> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    Optional<OrderEntity> findByIdAndCustomerId(UUID id, UUID customerId);
    List<OrderEntity> findAllByOrderByCreatedAtDesc();
    List<OrderEntity> findByStatusOrderByCreatedAtDesc(OrderStatus status);
}
