package org.aplication.backend.controller.admin;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import org.aplication.backend.common.enums.OrderStatus;
import org.aplication.backend.dto.response.order.OrderResponse;
import org.aplication.backend.service.interfaces.order.OrderService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {
    private final OrderService orderService;
    public AdminOrderController(OrderService orderService) { this.orderService = orderService; }
    @GetMapping public List<OrderResponse> findAll(@RequestParam(required = false) OrderStatus status) {
        return orderService.findAll(status);
    }
    @PatchMapping("/{orderId}/status")
    public OrderResponse changeStatus(@PathVariable UUID orderId, @RequestParam @NotNull OrderStatus status) {
        return orderService.changeStatus(orderId, status);
    }
}
