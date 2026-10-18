package com.banquethub.modules.notifications.dto;

import java.time.OffsetDateTime;

public record NotificationResponse(Long id, Long orderId, String eventType, String status,
        int attempts, String lastError, OffsetDateTime createdAt, OffsetDateTime sentAt) {}
