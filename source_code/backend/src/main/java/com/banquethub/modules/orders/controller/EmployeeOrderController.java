package com.banquethub.modules.orders.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.modules.orders.dto.OrderResponse;
import com.banquethub.modules.orders.entity.OrderStatus;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/v1/employee/orders")
@PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN')")
@Tag(name = "Nhân Viên - Xem Đơn Đặt Tiệc", description = "APIs xem danh sách và chi tiết đơn đặt tiệc dành cho Nhân viên chuẩn bị")
public class EmployeeOrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public EmployeeOrderController(OrderService orderService, UserRepository userRepository) {
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
    @Operation(summary = "Nhân viên xem danh sách đơn đặt tiệc")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getOrders(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) OrderStatus orderStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<OrderResponse> result = orderService.searchAdminOrders(
                keyword, orderStatus, null, fromDate, toDate, PageRequest.of(page, size, Sort.by("eventDateTime").ascending())
        );
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách đơn tiệc thành công", result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Nhân viên xem chi tiết đơn tiệc và danh sách món cần chuẩn bị")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUserDetails
    ) {
        User currentUser = resolveUser(currentUserDetails);
        OrderResponse order = orderService.getOrderById(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin chi tiết đơn tiệc thành công", order));
    }
}
