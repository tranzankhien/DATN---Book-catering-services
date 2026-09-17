package com.banquethub.modules.catalog.dto;

import com.banquethub.modules.catalog.entity.DishStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public class DishUpsertRequest {

    @NotBlank(message = "Mã món ăn không được để trống")
    @Size(max = 50, message = "Mã món ăn không vượt quá 50 ký tự")
    private String code;

    @NotBlank(message = "Tên món ăn không được để trống")
    @Size(max = 180, message = "Tên món ăn không vượt quá 180 ký tự")
    private String name;

    private String description;

    @Size(max = 500, message = "Đường dẫn ảnh không vượt quá 500 ký tự")
    private String imageUrl;

    @NotNull(message = "Giá bán một phần món không được để trống")
    @DecimalMin(value = "1000", inclusive = true, message = "Giá bán một phần món phải từ 1.000 VND trở lên")
    private BigDecimal price;

    @NotNull(message = "Danh mục món không được để trống")
    private Long categoryId;

    private DishStatus status = DishStatus.ACTIVE;

    @Valid
    private List<RecipeItemRequest> recipeItems;

    public DishUpsertRequest() {
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

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public DishStatus getStatus() {
        return status;
    }

    public void setStatus(DishStatus status) {
        this.status = status;
    }

    public List<RecipeItemRequest> getRecipeItems() {
        return recipeItems;
    }

    public void setRecipeItems(List<RecipeItemRequest> recipeItems) {
        this.recipeItems = recipeItems;
    }
}
