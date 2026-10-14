package com.banquethub.modules.orders.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.modules.orders.dto.CancelOrderRequest;
import com.banquethub.modules.orders.dto.CreateOrderRequest;
import com.banquethub.modules.orders.dto.OrderResponse;
import com.banquethub.modules.orders.entity.OrderStatus;
import com.banquethub.modules.orders.service.OrderService;
import com.banquethub.modules.users.entity.User;
import com.banquethub.modules.users.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Đơn Đặt Tiệc (Khách Hàng)", description = "APIs đặt tiệc, xem lịch sử đơn, chi tiết đơn và hủy đơn chưa thanh toán")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(OrderService orderService, UserRepository userRepository) {
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    private User resolveUser(CustomUserDetails details) {
        if (details == null || details.getId() == null) {
            return null;
        }
        return userRepository.findById(details.getId()).orElse(null);
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Tạo mới đơn đặt tiệc và giữ nguyên liệu trong 15 phút")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUserDetails
    ) {
        User currentUser = resolveUser(currentUserDetails);
        OrderResponse created = orderService.createOrder(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo đơn đặt tiệc thành công! Vui lòng hoàn tất trong vòng 15 phút.", created));
    }

    @GetMapping({"/my", "/my-orders"})
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xem danh sách đơn đặt tiệc của tài khoản hiện tại")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getMyOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal CustomUserDetails currentUserDetails
    ) {
        User currentUser = resolveUser(currentUserDetails);
        Page<OrderResponse> orders = orderService.getUserOrders(currentUser, status, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách đơn hàng thành công", orders));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xem chi tiết đơn hàng theo ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUserDetails
    ) {
        User currentUser = resolveUser(currentUserDetails);
        OrderResponse order = orderService.getOrderById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết đơn hàng thành công", order));
    }

    @GetMapping({"/code/{orderCode}", "/by-code/{orderCode}"})
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Xem chi tiết đơn hàng theo mã đơn")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByCode(
            @PathVariable String orderCode,
            @AuthenticationPrincipal CustomUserDetails currentUserDetails
    ) {
        User currentUser = resolveUser(currentUserDetails);
        OrderResponse order = orderService.getOrderByCode(orderCode, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết đơn hàng thành công", order));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Khách hàng hủy đơn đang chờ thanh toán (giải phóng tồn giữ ngay)")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id,
            @RequestBody(required = false) CancelOrderRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUserDetails
    ) {
        User currentUser = resolveUser(currentUserDetails);
        OrderResponse cancelled = orderService.cancelOrder(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Đã hủy đơn hàng và giải phóng nguyên liệu thành công.", cancelled));
    }
}
