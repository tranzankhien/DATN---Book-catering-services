package com.banquethub.modules.orders.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.orders.dto.OrderPreviewRequest;
import com.banquethub.modules.orders.dto.OrderPreviewResponse;
import com.banquethub.modules.orders.service.OrderPreviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Preview Thực Đơn & Đơn Tiệc", description = "APIs tính giá và kiểm tra tồn khả dụng theo thời gian thực (không giữ kho)")
public class OrderPreviewController {

    private final OrderPreviewService previewService;

    public OrderPreviewController(OrderPreviewService previewService) {
        this.previewService = previewService;
    }

    @PostMapping("/menus/preview")
    @Operation(summary = "Xem trước giá và nguyên liệu cho thực đơn (theo số bàn)")
    public ResponseEntity<ApiResponse<OrderPreviewResponse>> previewMenu(@Valid @RequestBody OrderPreviewRequest request) {
        OrderPreviewResponse response = previewService.previewOrder(request);
        return ResponseEntity.ok(ApiResponse.ok("Tính toán xem trước thực đơn thành công", response));
    }

    @PostMapping("/orders/preview")
    @Operation(summary = "Xem trước tổng tiền và kiểm tra đủ nguyên liệu trước khi đặt tiệc")
    public ResponseEntity<ApiResponse<OrderPreviewResponse>> previewOrder(@Valid @RequestBody OrderPreviewRequest request) {
        OrderPreviewResponse response = previewService.previewOrder(request);
        return ResponseEntity.ok(ApiResponse.ok("Tính toán kiểm tra đơn tiệc thành công", response));
    }
}
