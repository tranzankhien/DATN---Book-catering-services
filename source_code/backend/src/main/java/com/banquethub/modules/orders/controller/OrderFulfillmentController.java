package com.banquethub.modules.orders.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.modules.orders.dto.OrderResponse;
import com.banquethub.modules.orders.entity.OrderStatus;
import com.banquethub.modules.orders.service.OrderFulfillmentService;
import com.banquethub.modules.users.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/admin/orders","/api/v1/employee/orders"})
@PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE')")
public class OrderFulfillmentController {
    public record StatusRequest(@NotNull OrderStatus status) {}
    private final OrderFulfillmentService fulfillment;
    private final UserRepository users;
    public OrderFulfillmentController(OrderFulfillmentService fulfillment,UserRepository users) {this.fulfillment=fulfillment;this.users=users;}
    @PatchMapping("/{id}/status")
    public ApiResponse<OrderResponse> update(@PathVariable long id,@Valid @RequestBody StatusRequest request,
            @AuthenticationPrincipal CustomUserDetails details) {
        return ApiResponse.ok("Đã cập nhật tiến độ đơn tiệc",fulfillment.transition(id,request.status(),
                details==null ? null : users.findById(details.getId()).orElse(null)));
    }
}
