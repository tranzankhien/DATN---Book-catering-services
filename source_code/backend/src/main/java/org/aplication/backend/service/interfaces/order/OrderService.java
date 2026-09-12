package org.aplication.backend.service.interfaces.order;

import java.util.List;
import java.util.UUID;
import org.aplication.backend.dto.request.user.CreateOrderRequest;
import org.aplication.backend.dto.response.order.OrderResponse;
import org.aplication.backend.common.enums.OrderStatus;

public interface OrderService {
    OrderResponse create(UUID customerId, CreateOrderRequest request);
    List<OrderResponse> findMine(UUID customerId);
    OrderResponse findMineById(UUID customerId, UUID orderId);
    List<OrderResponse> findAll(OrderStatus status);
    OrderResponse changeStatus(UUID orderId, OrderStatus status);
}
