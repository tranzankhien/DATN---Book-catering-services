package com.banquethub.modules.menus.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public class CreateMenuRequest {

    @NotBlank(message = "Tên thực đơn không được để trống")
    @Size(max = 200, message = "Tên thực đơn không vượt quá 200 ký tự")
    private String name;

    private String description;

    private String imageUrl;

    @NotEmpty(message = "Thực đơn phải có ít nhất 1 món ăn")
    @Valid
    private List<MenuItemRequest> items;

    public CreateMenuRequest() {}

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

    public List<MenuItemRequest> getItems() {
        return items;
    }

    public void setItems(List<MenuItemRequest> items) {
        this.items = items;
    }
}
