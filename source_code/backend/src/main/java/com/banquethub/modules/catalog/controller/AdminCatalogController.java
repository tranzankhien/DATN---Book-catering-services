package com.banquethub.modules.catalog.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.catalog.dto.CategoryRequest;
import com.banquethub.modules.catalog.dto.CategoryResponse;
import com.banquethub.modules.catalog.dto.DishDetailResponse;
import com.banquethub.modules.catalog.dto.DishRecipeUpdateRequest;
import com.banquethub.modules.catalog.dto.DishStatusUpdateRequest;
import com.banquethub.modules.catalog.dto.DishUpsertRequest;
import com.banquethub.modules.catalog.dto.IngredientRequest;
import com.banquethub.modules.catalog.dto.IngredientResponse;
import com.banquethub.modules.catalog.entity.DishStatus;
import com.banquethub.modules.catalog.service.CatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/catalog")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Tag(name = "Admin Catalog & Recipe", description = "API Quản trị món ăn, danh mục, nguyên liệu và định lượng công thức")
public class AdminCatalogController {

    private final CatalogService catalogService;

    public AdminCatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    // --- Categories ---

    @GetMapping("/categories")
    @Operation(summary = "Admin xem toàn bộ danh mục món ăn")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok(catalogService.getAdminCategories()));
    }

    @PostMapping("/categories")
    @Operation(summary = "Admin tạo danh mục món ăn mới")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse created = catalogService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo danh mục món thành công", created));
    }

    // --- Ingredients ---

    @GetMapping("/ingredients")
    @Operation(summary = "Admin xem danh sách nguyên liệu để cấu hình công thức")
    public ResponseEntity<ApiResponse<List<IngredientResponse>>> getIngredients() {
        return ResponseEntity.ok(ApiResponse.ok(catalogService.getAdminIngredients()));
    }

    @PostMapping("/ingredients")
    @Operation(summary = "Admin thêm nguyên liệu mới")
    public ResponseEntity<ApiResponse<IngredientResponse>> createIngredient(@Valid @RequestBody IngredientRequest request) {
        IngredientResponse created = catalogService.createIngredient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Thêm nguyên liệu mới thành công", created));
    }

    @PutMapping("/ingredients/{id}")
    @Operation(summary = "Admin cập nhật thông tin nguyên liệu")
    public ResponseEntity<ApiResponse<IngredientResponse>> updateIngredient(
            @PathVariable Long id,
            @Valid @RequestBody IngredientRequest request
    ) {
        IngredientResponse updated = catalogService.updateIngredient(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật nguyên liệu thành công", updated));
    }

    // --- Dishes & Recipes ---

    @GetMapping("/dishes")
    @Operation(summary = "Admin xem danh sách toàn bộ món ăn kèm công thức")
    public ResponseEntity<ApiResponse<List<DishDetailResponse>>> getDishes(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) DishStatus status,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(ApiResponse.ok(catalogService.getAdminDishes(categoryId, status, keyword)));
    }

    @GetMapping("/dishes/{id}")
    @Operation(summary = "Admin xem chi tiết món ăn và công thức")
    public ResponseEntity<ApiResponse<DishDetailResponse>> getDishDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(catalogService.getAdminDishDetail(id)));
    }

    @PostMapping("/dishes")
    @Operation(summary = "Admin thêm món ăn mới kèm công thức nguyên liệu")
    public ResponseEntity<ApiResponse<DishDetailResponse>> createDish(@Valid @RequestBody DishUpsertRequest request) {
        DishDetailResponse created = catalogService.createDish(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Thêm món ăn mới thành công", created));
    }

    @PutMapping("/dishes/{id}")
    @Operation(summary = "Admin cập nhật thông tin món ăn và công thức")
    public ResponseEntity<ApiResponse<DishDetailResponse>> updateDish(
            @PathVariable Long id,
            @Valid @RequestBody DishUpsertRequest request
    ) {
        DishDetailResponse updated = catalogService.updateDish(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật món ăn thành công", updated));
    }

    @PatchMapping("/dishes/{id}/status")
    @Operation(summary = "Admin ẩn hoặc hiển thị lại món ăn (ACTIVE / HIDDEN)")
    public ResponseEntity<ApiResponse<DishDetailResponse>> updateDishStatus(
            @PathVariable Long id,
            @Valid @RequestBody DishStatusUpdateRequest request
    ) {
        DishDetailResponse updated = catalogService.updateDishStatus(id, request.getStatus());
        String msg = request.getStatus() == DishStatus.HIDDEN
                ? "Đã chuyển món ăn sang trạng thái ẩn"
                : "Đã kích hoạt hiển thị món ăn";
        return ResponseEntity.ok(ApiResponse.ok(msg, updated));
    }

    @PutMapping("/dishes/{id}/recipe")
    @Operation(summary = "Admin cấu hình / cập nhật công thức nguyên liệu của món ăn")
    public ResponseEntity<ApiResponse<DishDetailResponse>> updateDishRecipe(
            @PathVariable Long id,
            @Valid @RequestBody DishRecipeUpdateRequest request
    ) {
        DishDetailResponse updated = catalogService.updateDishRecipe(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật công thức định lượng thành công", updated));
    }
}
