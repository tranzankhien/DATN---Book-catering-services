package com.banquethub.modules.inventory.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.catalog.dto.IngredientResponse;
import com.banquethub.modules.inventory.dto.IngredientStockDetailResponse;
import com.banquethub.modules.inventory.dto.InventorySummaryResponse;
import com.banquethub.modules.inventory.dto.StockAdjustmentRequest;
import com.banquethub.modules.inventory.dto.StockAdjustmentResponse;
import com.banquethub.modules.inventory.dto.StockMovementResponse;
import com.banquethub.modules.inventory.entity.MovementType;
import com.banquethub.modules.inventory.service.InventoryService;
import com.banquethub.modules.users.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/inventory")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Tag(name = "Admin Inventory", description = "API Quản trị kho nguyên liệu, tồn kho, điều chỉnh và sổ biến động")
public class AdminInventoryController {

    private final InventoryService inventoryService;

    public AdminInventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/overview")
    @Operation(summary = "Tổng quan kho nguyên liệu, giá trị tồn và cảnh báo tồn thấp")
    public ResponseEntity<ApiResponse<InventorySummaryResponse>> getOverview() {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getInventorySummary()));
    }

    @GetMapping("/ingredients")
    @Operation(summary = "Danh sách nguyên liệu tồn kho (tìm kiếm, lọc theo trạng thái và tồn thấp)")
    public ResponseEntity<ApiResponse<List<IngredientResponse>>> getIngredients(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "false") boolean lowStockOnly
    ) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.searchIngredients(keyword, active, lowStockOnly)));
    }

    @GetMapping("/ingredients/{id}")
    @Operation(summary = "Xem chi tiết nguyên liệu, lịch sử biến động và các món ăn đang sử dụng")
    public ResponseEntity<ApiResponse<IngredientStockDetailResponse>> getIngredientDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getIngredientDetail(id)));
    }

    @DeleteMapping("/ingredients/{id}")
    @Operation(summary = "Xóa vĩnh viễn nguyên liệu nếu chưa từng phát sinh giao dịch hoặc công thức")
    public ResponseEntity<ApiResponse<Void>> deleteIngredient(@PathVariable Long id) {
        inventoryService.deleteIngredient(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa nguyên liệu thành công", null));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Danh sách nguyên liệu có tồn kho dưới hoặc bằng ngưỡng tối thiểu")
    public ResponseEntity<ApiResponse<List<IngredientResponse>>> getLowStockIngredients() {
        return ResponseEntity.ok(ApiResponse.ok(inventoryService.getLowStockIngredients()));
    }

    @PostMapping("/adjustments")
    @Operation(summary = "Điều chỉnh tồn kho nguyên liệu thủ công (có lý do bắt buộc và ghi nhận sổ biến động)")
    public ResponseEntity<ApiResponse<StockAdjustmentResponse>> adjustStock(
            @Valid @RequestBody StockAdjustmentRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        StockAdjustmentResponse response = inventoryService.adjustStock(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Điều chỉnh tồn kho thành công", response));
    }

    @GetMapping("/movements")
    @Operation(summary = "Tra cứu sổ biến động kho nguyên liệu (lọc theo nguyên liệu, loại biến động, khoảng thời gian và phân trang)")
    public ResponseEntity<ApiResponse<List<StockMovementResponse>>> getMovements(
            @RequestParam(required = false) Long ingredientId,
            @RequestParam(required = false) MovementType movementType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime fromTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime toTime,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer limit
    ) {
        int effectiveSize = limit != null ? limit : size;
        org.springframework.data.domain.Page<StockMovementResponse> pagedResult =
                inventoryService.searchMovementsPaged(ingredientId, movementType, fromTime, toTime, page, effectiveSize);

        return ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(pagedResult.getTotalElements()))
                .header("X-Total-Pages", String.valueOf(pagedResult.getTotalPages()))
                .header("X-Current-Page", String.valueOf(pagedResult.getNumber()))
                .header("X-Page-Size", String.valueOf(pagedResult.getSize()))
                .body(ApiResponse.ok(pagedResult.getContent()));
    }
}

