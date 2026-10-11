package com.banquethub.modules.reservations.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.reservations.dto.StockAvailabilityResponse;
import com.banquethub.modules.reservations.dto.StockReservationResponse;
import com.banquethub.modules.reservations.entity.ReservationStatus;
import com.banquethub.modules.reservations.service.StockReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/inventory")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Giữ Kho & Tồn Khả Dụng", description = "APIs theo dõi lượng nguyên liệu được giữ cho các đơn tiệc")
public class AdminReservationController {

    private final StockReservationService reservationService;

    public AdminReservationController(StockReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping("/reservations")
    @Operation(summary = "Danh sách các lượt giữ nguyên liệu đơn tiệc")
    public ResponseEntity<ApiResponse<Page<StockReservationResponse>>> getReservations(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Page<StockReservationResponse> result = reservationService.searchAdminReservations(
                keyword, status, PageRequest.of(page, size, Sort.by("createdAt").descending())
        );
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách giữ kho thành công", result));
    }

    @GetMapping("/availability")
    @Operation(summary = "Xem tổng quan tồn kho khả dụng (Tồn thực tế - Đang giữ)")
    public ResponseEntity<ApiResponse<List<StockAvailabilityResponse>>> getStockAvailability() {
        List<StockAvailabilityResponse> list = reservationService.getStockAvailabilityList();
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách tồn khả dụng thành công", list));
    }
}
