package org.aplication.backend.mapper.order;

import org.aplication.backend.dto.response.order.OrderResponse;
import org.aplication.backend.entity.order.OrderEntity;
import org.springframework.stereotype.Component;

@Component
public class OrderMapper {
    public OrderResponse toResponse(OrderEntity e) {
        return new OrderResponse(e.getId(), e.getOrderCode(), e.getHall() == null ? null : e.getHall().getId(),
                e.getServiceLocation(), e.getStatus(), e.getEventStart(), e.getEventEnd(), e.getGuestCount(),
                e.getContactName(), e.getContactPhone(), e.getEventAddress(), e.getTotalAmount(), e.getNote(),
                e.getItems().stream().map(i -> new OrderResponse.Item(i.getId(), i.getItemType(), i.getReferenceId(),
                        i.getItemName(), i.getQuantity(), i.getUnitPrice(), i.getLineTotal())).toList());
    }
}
