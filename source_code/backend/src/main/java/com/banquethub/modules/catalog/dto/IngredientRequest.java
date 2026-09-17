package com.banquethub.modules.catalog.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class IngredientRequest {

    @NotBlank(message = "Mã nguyên liệu không được để trống")
    @Size(max = 50, message = "Mã nguyên liệu không vượt quá 50 ký tự")
    private String code;

    @NotBlank(message = "Tên nguyên liệu không được để trống")
    @Size(max = 150, message = "Tên nguyên liệu không vượt quá 150 ký tự")
    private String name;

    @NotBlank(message = "Đơn vị gốc không được để trống (ví dụ: kg, lít, cái)")
    @Size(max = 30, message = "Đơn vị không vượt quá 30 ký tự")
    private String unit;

    @NotNull(message = "Ngưỡng tồn tối thiểu không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Ngưỡng tồn tối thiểu phải lớn hơn hoặc bằng 0")
    private BigDecimal minStockThreshold = BigDecimal.ZERO;

    private Boolean active = true;

    public IngredientRequest() {
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

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getMinStockThreshold() {
        return minStockThreshold;
    }

    public void setMinStockThreshold(BigDecimal minStockThreshold) {
        this.minStockThreshold = minStockThreshold;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
