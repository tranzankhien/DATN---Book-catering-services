package com.banquethub.modules.catalog.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class DishRecipeUpdateRequest {

    @NotEmpty(message = "Công thức món ăn phải có ít nhất 01 nguyên liệu")
    @Valid
    private List<RecipeItemRequest> recipeItems;

    public DishRecipeUpdateRequest() {
    }

    public List<RecipeItemRequest> getRecipeItems() {
        return recipeItems;
    }

    public void setRecipeItems(List<RecipeItemRequest> recipeItems) {
        this.recipeItems = recipeItems;
    }
}
