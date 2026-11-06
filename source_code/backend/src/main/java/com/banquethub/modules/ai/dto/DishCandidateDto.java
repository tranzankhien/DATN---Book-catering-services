package com.banquethub.modules.ai.dto;

import java.math.BigDecimal;
import java.util.List;

public class DishCandidateDto {

    private Long dishId;
    private String code;
    private String name;
    private String category;
    private BigDecimal price;
    private String description;
    private String imageUrl;
    private List<String> ingredients;

    public DishCandidateDto() {
    }

    public DishCandidateDto(Long dishId, String code, String name, String category, BigDecimal price, String description, String imageUrl, List<String> ingredients) {
        this.dishId = dishId;
        this.code = code;
        this.name = name;
        this.category = category;
        this.price = price;
        this.description = description;
        this.imageUrl = imageUrl;
        this.ingredients = ingredients;
    }

    public Long getDishId() {
        return dishId;
    }

    public Long getId() {
        return dishId;
    }

    public void setDishId(Long dishId) {
        this.dishId = dishId;
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

    public String getCategory() {
        return category;
    }

    public String getCategoryName() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
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

    public List<String> getIngredients() {
        return ingredients;
    }

    public void setIngredients(List<String> ingredients) {
        this.ingredients = ingredients;
    }
}
