package com.banquethub.modules.catalog.dto;

import com.banquethub.modules.catalog.entity.Dish;
import com.banquethub.modules.catalog.entity.DishStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;

public class DishDetailResponse {

    private Long id;
    private String code;
    private String name;
    private String description;
    private String imageUrl;
    private BigDecimal price;
    private DishStatus status;
    private Long categoryId;
    private String categoryCode;
    private String categoryName;
    private List<RecipeItemResponse> recipeItems;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public DishDetailResponse() {
    }

    public static DishDetailResponse fromEntity(Dish entity) {
        DishDetailResponse dto = new DishDetailResponse();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setImageUrl(entity.getImageUrl());
        dto.setPrice(entity.getPrice());
        dto.setStatus(entity.getStatus());
        dto.setCategoryId(entity.getCategory().getId());
        dto.setCategoryCode(entity.getCategory().getCode());
        dto.setCategoryName(entity.getCategory().getName());
        List<RecipeItemResponse> items = entity.getRecipeItems() == null
                ? List.of()
                : entity.getRecipeItems().stream()
                        .map(RecipeItemResponse::fromEntity)
                        .sorted(Comparator.comparing(RecipeItemResponse::getIngredientName))
                        .toList();
        dto.setRecipeItems(items);
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public DishStatus getStatus() {
        return status;
    }

    public void setStatus(DishStatus status) {
        this.status = status;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryCode() {
        return categoryCode;
    }

    public void setCategoryCode(String categoryCode) {
        this.categoryCode = categoryCode;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public List<RecipeItemResponse> getRecipeItems() {
        return recipeItems;
    }

    public void setRecipeItems(List<RecipeItemResponse> recipeItems) {
        this.recipeItems = recipeItems;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
