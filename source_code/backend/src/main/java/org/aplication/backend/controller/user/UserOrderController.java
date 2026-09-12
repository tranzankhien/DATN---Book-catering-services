package org.aplication.backend.controller.user;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.aplication.backend.dto.request.user.CreateOrderRequest;
import org.aplication.backend.dto.response.order.OrderResponse;
import org.aplication.backend.service.interfaces.order.OrderService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/orders")
public class UserOrderController {
    private final OrderService orderService;
    public UserOrderController(OrderService orderService) { this.orderService = orderService; }
    @PostMapping public OrderResponse create(Authentication authentication, @Valid @RequestBody CreateOrderRequest request) {
        return orderService.create((UUID) authentication.getPrincipal(), request);
    }
    @GetMapping public List<OrderResponse> mine(Authentication authentication) {
        return orderService.findMine((UUID) authentication.getPrincipal());
    }
    @GetMapping("/{orderId}") public OrderResponse detail(Authentication authentication, @PathVariable UUID orderId) {
        return orderService.findMineById((UUID) authentication.getPrincipal(), orderId);
    }
}
