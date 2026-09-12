package org.aplication.backend.dto.response.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.aplication.backend.common.enums.OrderItemType;
import org.aplication.backend.common.enums.OrderStatus;
import org.aplication.backend.common.enums.ServiceLocation;

public record OrderResponse(UUID id, String orderCode, UUID hallId, ServiceLocation serviceLocation,
                            OrderStatus status, Instant eventStart, Instant eventEnd, int guestCount,
                            String contactName, String contactPhone, String eventAddress,
                            BigDecimal totalAmount, String note, List<Item> items) {
    public record Item(UUID id, OrderItemType itemType, UUID referenceId, String itemName,
                       BigDecimal quantity, BigDecimal unitPrice, BigDecimal lineTotal) {}
}
