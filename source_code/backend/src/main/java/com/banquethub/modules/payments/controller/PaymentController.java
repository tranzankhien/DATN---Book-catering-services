package com.banquethub.modules.payments.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.modules.payments.config.SePayConfig;
import com.banquethub.modules.payments.service.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
public class PaymentController {
    private final PaymentService service;
    private final SePayConfig config;
    private final PaymentAuditService audit;
    private final SePayQueryService queryService;

    public PaymentController(PaymentService service,SePayConfig config,PaymentAuditService audit,SePayQueryService queryService) {
        this.service=service;
        this.config=config;
        this.audit=audit;
        this.queryService=queryService;
    }

    public record CreateRequest(@NotNull @Positive Long orderId, String returnUrl) {}
    public record ReviewRequest(
        @jakarta.validation.constraints.NotBlank String action,
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=300) String reason,
        @jakarta.validation.constraints.Size(max=80) String resolutionReference) {}

    @PostMapping("/admin/payments/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<com.banquethub.modules.payments.dto.PaymentView> resolve(
            @PathVariable Long id,@Valid @RequestBody ReviewRequest review,@AuthenticationPrincipal CustomUserDetails user) {
        return ApiResponse.ok("Đã xử lý đối soát",service.resolveReview(id,review.action(),review.reason(),review.resolutionReference(),user.getId()));
    }

    @PostMapping("/payments/sepay/create")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EMPLOYEE')")
    public ApiResponse<PaymentService.Attempt> create(@Valid @RequestBody CreateRequest body,
            @AuthenticationPrincipal CustomUserDetails user,
            HttpServletRequest request) {
        String effectiveReturnUrl = body.returnUrl();
        if (effectiveReturnUrl == null || effectiveReturnUrl.isBlank()) {
            String origin = request.getHeader("Origin");
            if (origin != null && !origin.isBlank()) {
                effectiveReturnUrl = origin + "/payment/result";
            } else {
                String referer = request.getHeader("Referer");
                if (referer != null && !referer.isBlank()) {
                    try {
                        java.net.URI uri = java.net.URI.create(referer);
                        effectiveReturnUrl = uri.getScheme() + "://" + uri.getAuthority() + "/payment/result";
                    } catch (Exception ignored) {
                    }
                }
            }
        }
        return ApiResponse.ok("Đã tạo yêu cầu thanh toán",
                service.create(body.orderId(), user.getId(), isAdmin(user), effectiveReturnUrl));
    }

    @PostMapping("/payments/orders/{id}/simulate-sandbox-pay")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EMPLOYEE')")
    public ApiResponse<com.banquethub.modules.payments.dto.PaymentView> simulateSandboxPay(
            @PathVariable Long id, @AuthenticationPrincipal CustomUserDetails user) {
        return ApiResponse.ok("Đã giả lập thanh toán Sandbox thành công",
                service.simulateSandboxSuccess(id, user.getId(), isAdmin(user)));
    }

    @PostMapping("/payments/sepay/ipn")
    public ResponseEntity<Map<String,Boolean>> ipn(
            @RequestHeader(value="X-Secret-Key", required=false) String secret,
            @RequestBody com.fasterxml.jackson.databind.JsonNode payload) {
        boolean isWebhookTest = payload.path("order").path("custom_data").path("webhook_test").asBoolean(false)
                || payload.path("custom_data").path("webhook_test").asBoolean(false)
                || payload.path("order").path("order_id").asText("").startsWith("TEST_ORDER_");
        if (isWebhookTest) {
            return ResponseEntity.ok(Map.of("success",true));
        }
        if (config.ipnSecret == null || config.ipnSecret.isBlank() || secret == null || !java.security.MessageDigest.isEqual(
                config.ipnSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                secret.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
            return ResponseEntity.status(401).body(Map.of("success",false));
        }
        var order = payload.path("order");
        String reference = order.path("order_invoice_number").asText();
        String type = payload.path("notification_type").asText();
        if ("ORDER_PAID".equals(type) || "PAYMENT_SUCCESS".equals(type)) {
            service.applyCaptured(order,payload.path("transaction"));
            audit.record(reference,"IPN",type,"SePay notification processed");
        } else if ("TRANSACTION_VOID".equals(type)) {
            service.applyVoid(order);
            audit.record(reference,"IPN","TRANSACTION_VOID","SePay void notification processed");
        } else {
            return ResponseEntity.badRequest().body(Map.of("success",false));
        }
        return ResponseEntity.ok(Map.of("success",true));
    }

    @GetMapping("/orders/{id}/payment-status")
    public ApiResponse<PaymentService.Status> status(@PathVariable Long id,@AuthenticationPrincipal CustomUserDetails user) {
        return ApiResponse.ok("Trạng thái thanh toán",service.status(id,user.getId(),isAdmin(user)));
    }

    @GetMapping("/payments/reference/{reference}")
    public ApiResponse<PaymentService.Status> reference(@PathVariable String reference,
            @AuthenticationPrincipal CustomUserDetails user) {
        Long userId = user != null ? user.getId() : null;
        boolean admin = user != null && isAdmin(user);
        return ApiResponse.ok("Trạng thái thanh toán", service.reference(reference, userId, admin));
    }

    @GetMapping({"/admin/payments","/admin/payments/review"})
    public ApiResponse<Page<com.banquethub.modules.payments.dto.PaymentView>> search(
            @RequestParam(required=false) String status,@RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="20") int size,HttpServletRequest request) {
        String filter=request.getRequestURI().endsWith("/review")?"REVIEW_REQUIRED":status;
        return ApiResponse.ok("Danh sách giao dịch",service.search(filter,PageRequest.of(Math.max(page,0),Math.min(Math.max(size,1),100),Sort.by("createdAt").descending())));
    }

    @GetMapping("/admin/payments/{id}")
    public ApiResponse<com.banquethub.modules.payments.dto.PaymentView> detail(@PathVariable Long id) {
        return ApiResponse.ok("Chi tiết giao dịch",service.detail(id));
    }

    private boolean isAdmin(CustomUserDetails user) {
        return user.getRole()==com.banquethub.modules.users.entity.Role.ROLE_ADMIN;
    }

    @PostMapping("/admin/payments/{id}/query")
    public ApiResponse<com.banquethub.modules.payments.dto.PaymentView> query(@PathVariable Long id) {
        return ApiResponse.ok("Đã truy vấn SePay",queryService.query(id));
    }
}
