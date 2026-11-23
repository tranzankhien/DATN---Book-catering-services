package com.banquethub.modules.vouchers.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ApplyVoucherRequest {

    @NotBlank(message = "Vui lòng nhập mã giảm giá")
    private String code;

    @NotNull(message = "Giá trị đơn hàng không được để trống")
    @DecimalMin(value = "0.01", message = "Giá trị đơn hàng phải lớn hơn 0")
    private BigDecimal orderAmount;

    public ApplyVoucherRequest() {}

    public ApplyVoucherRequest(String code, BigDecimal orderAmount) {
        this.code = code;
        this.orderAmount = orderAmount;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public BigDecimal getOrderAmount() { return orderAmount; }
    public void setOrderAmount(BigDecimal orderAmount) { this.orderAmount = orderAmount; }
}
