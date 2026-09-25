package com.banquethub.modules.catalog.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class DishRecipeUpdateRequest {

    @NotEmpty(message = "Công thức món ăn phải có ít nhất 01 nguyên liệu")
    @Valid
    private List<@NotNull(message = "Dòng nguyên liệu trong công thức không được để trống") RecipeItemRequest> recipeItems;

    public DishRecipeUpdateRequest() {
    }

    public List<RecipeItemRequest> getRecipeItems() {
        return recipeItems;
    }

    public void setRecipeItems(List<RecipeItemRequest> recipeItems) {
        this.recipeItems = recipeItems;
    }
}
