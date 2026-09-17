package com.banquethub.modules.catalog.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.catalog.dto.CategoryResponse;
import com.banquethub.modules.catalog.dto.DishDetailResponse;
import com.banquethub.modules.catalog.dto.DishSummaryResponse;
import com.banquethub.modules.catalog.service.CatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/catalog")
@Tag(name = "Public Catalog", description = "API công khai xem danh mục món, danh sách món ăn và chi tiết món")
public class PublicCatalogController {

    private final CatalogService catalogService;

    public PublicCatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/categories")
    @Operation(summary = "Xem danh sách danh mục món ăn đang hoạt động")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.ok(catalogService.getPublicCategories()));
    }

    @GetMapping("/dishes")
    @Operation(summary = "Xem danh sách món ăn công khai (lọc theo danh mục, từ khóa)")
    public ResponseEntity<ApiResponse<List<DishSummaryResponse>>> getDishes(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(ApiResponse.ok(catalogService.getPublicDishes(categoryId, keyword)));
    }

    @GetMapping("/dishes/{id}")
    @Operation(summary = "Xem chi tiết món ăn và thành phần nguyên liệu")
    public ResponseEntity<ApiResponse<DishDetailResponse>> getDishDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(catalogService.getPublicDishDetail(id)));
    }
}
