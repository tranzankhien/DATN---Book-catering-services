package com.banquethub.modules.vouchers.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.modules.vouchers.dto.ApplyVoucherRequest;
import com.banquethub.modules.vouchers.dto.VoucherValidationResponse;
import com.banquethub.modules.vouchers.service.VoucherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vouchers")
@Tag(name = "Voucher Customer API", description = "Kiểm tra và áp dụng mã voucher giảm giá cho đơn tiệc")
public class VoucherController {

    private final VoucherService voucherService;

    public VoucherController(VoucherService voucherService) {
        this.voucherService = voucherService;
    }

    @PostMapping("/apply")
    @Operation(summary = "Kiểm tra tính hợp lệ và tính số tiền giảm của mã voucher")
    public ResponseEntity<ApiResponse<VoucherValidationResponse>> applyVoucher(
            @Valid @RequestBody ApplyVoucherRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        VoucherValidationResponse response = voucherService.validateAndCalculate(
                request.getCode(),
                request.getOrderAmount(),
                userId
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
