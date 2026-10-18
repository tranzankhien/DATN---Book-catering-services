package com.banquethub.modules.notifications.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.notifications.dto.NotificationResponse;
import com.banquethub.modules.notifications.service.EmailOutboxService;
import org.springframework.data.domain.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/notifications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {
    private final EmailOutboxService outbox;
    public AdminNotificationController(EmailOutboxService outbox) {this.outbox=outbox;}
    @GetMapping
    public ApiResponse<Page<NotificationResponse>> list(@RequestParam(required=false) String status,
            @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size) {
        return ApiResponse.ok("Danh sách thông báo email",outbox.list(status,PageRequest.of(Math.max(0,page),Math.max(1,Math.min(100,size)))));
    }
    @PostMapping("/{id}/retry")
    public ApiResponse<NotificationResponse> retry(@PathVariable long id) {
        return ApiResponse.ok("Đã đưa email vào hàng đợi gửi lại",outbox.retry(id));
    }
}
