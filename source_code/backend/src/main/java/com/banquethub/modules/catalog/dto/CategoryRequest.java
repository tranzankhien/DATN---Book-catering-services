package com.banquethub.modules.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CategoryRequest {

    @NotBlank(message = "Mã danh mục không được để trống")
    @Size(max = 50, message = "Mã danh mục không vượt quá 50 ký tự")
    private String code;

    @NotBlank(message = "Tên danh mục không được để trống")
    @Size(max = 120, message = "Tên danh mục không vượt quá 120 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả danh mục không vượt quá 500 ký tự")
    private String description;

    private Integer displayOrder = 0;

    private Boolean active = true;

    public CategoryRequest() {
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

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
