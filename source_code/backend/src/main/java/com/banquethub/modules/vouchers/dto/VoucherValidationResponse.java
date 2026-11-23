package com.banquethub.modules.vouchers.dto;

import java.math.BigDecimal;

public class VoucherValidationResponse {

    private boolean valid;
    private String message;
    private String voucherCode;
    private String voucherName;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;

    public VoucherValidationResponse() {}

    public static VoucherValidationResponse success(String code, String name, BigDecimal discount, BigDecimal finalAmount) {
        VoucherValidationResponse r = new VoucherValidationResponse();
        r.setValid(true);
        r.setMessage("Áp dụng mã giảm giá thành công");
        r.setVoucherCode(code);
        r.setVoucherName(name);
        r.setDiscountAmount(discount);
        r.setFinalAmount(finalAmount);
        return r;
    }

    public static VoucherValidationResponse invalid(String message) {
        VoucherValidationResponse r = new VoucherValidationResponse();
        r.setValid(false);
        r.setMessage(message);
        r.setDiscountAmount(BigDecimal.ZERO);
        return r;
    }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getVoucherCode() { return voucherCode; }
    public void setVoucherCode(String voucherCode) { this.voucherCode = voucherCode; }
    public String getVoucherName() { return voucherName; }
    public void setVoucherName(String voucherName) { this.voucherName = voucherName; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public BigDecimal getFinalAmount() { return finalAmount; }
    public void setFinalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; }
}
