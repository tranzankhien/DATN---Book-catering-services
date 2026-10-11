package com.banquethub.modules.orders.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.modules.orders.dto.CancelOrderRequest;
import com.banquethub.modules.orders.dto.OrderResponse;
import com.banquethub.modules.orders.entity.OrderStatus;
import com.banquethub.modules.orders.entity.PaymentStatus;
import com.banquethub.modules.orders.service.OrderService;
import com.banquethub.modules.users.entity.User;
import com.banquethub.modules.users.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/v1/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Quản Lý Đơn Đặt Tiệc", description = "APIs tìm kiếm, lọc, xem chi tiết và hủy đơn tiệc cho Quản trị viên")
public class AdminOrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public AdminOrderController(OrderService orderService, UserRepository userRepository) {
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    private User resolveUser(CustomUserDetails details) {
        if (details == null || details.getId() == null) {
            return null;
        }
        return userRepository.findById(details.getId()).orElse(null);
    }

    @GetMapping
    @Operation(summary = "Tìm kiếm và phân trang danh sách đơn đặt tiệc toàn hệ thống")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> searchOrders(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) OrderStatus orderStatus,
            @RequestParam(required = false) PaymentStatus paymentStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = "asc".equalsIgnoreCase(direction) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Page<OrderResponse> result = orderService.searchAdminOrders(
                keyword, orderStatus, paymentStatus, fromDate, toDate, PageRequest.of(page, size, sort)
        );
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách đơn hàng thành công", result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem toàn bộ chi tiết đơn đặt tiệc và lịch sử trạng thái")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails adminUserDetails
    ) {
        User adminUser = resolveUser(adminUserDetails);
        OrderResponse order = orderService.getOrderById(id, adminUser);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết đơn hàng thành công", order));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Admin hủy đơn hàng chưa thanh toán (giải phóng tồn kho ngay)")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id,
            @RequestBody(required = false) CancelOrderRequest request,
            @AuthenticationPrincipal CustomUserDetails adminUserDetails
    ) {
        User adminUser = resolveUser(adminUserDetails);
        OrderResponse cancelled = orderService.cancelOrder(id, request, adminUser);
        return ResponseEntity.ok(ApiResponse.ok("Đã hủy đơn hàng thành công", cancelled));
    }
}
