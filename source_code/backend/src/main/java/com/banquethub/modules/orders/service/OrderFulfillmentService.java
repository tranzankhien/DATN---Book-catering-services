package com.banquethub.modules.orders.service;

import com.banquethub.common.exception.*;
import com.banquethub.modules.orders.dto.OrderResponse;
import com.banquethub.modules.orders.entity.*;
import com.banquethub.modules.orders.repository.OrderRepository;
import com.banquethub.modules.notifications.service.EmailOutboxService;
import com.banquethub.modules.users.entity.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderFulfillmentService {
    private final OrderRepository orders;
    private final EmailOutboxService emails;
    public OrderFulfillmentService(OrderRepository orders,EmailOutboxService emails) {this.orders=orders;this.emails=emails;}
    @Transactional
    public OrderResponse transition(long id,OrderStatus target,User actor) {
        if(actor==null || (actor.getRole()!=Role.ROLE_ADMIN && actor.getRole()!=Role.ROLE_EMPLOYEE))
            throw new BusinessValidationException("Bạn không có quyền cập nhật tiến độ đơn tiệc.");
        Order order=orders.findByIdForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn tiệc."));
        OrderStatus previous=order.getOrderStatus();
        if(order.getPaymentStatus()!=PaymentStatus.PAID ||
                !((previous==OrderStatus.PAID && target==OrderStatus.PREPARING) ||
                  (previous==OrderStatus.PREPARING && target==OrderStatus.COMPLETED)))
            throw new BusinessValidationException("Chỉ được chuyển đơn đã thanh toán từ PAID → PREPARING → COMPLETED.");
        order.setOrderStatus(target);
        order.addStatusHistory(new OrderStatusHistory(order,previous,target,actor,actor.getFullName(),
                target==OrderStatus.PREPARING ? "Nhân viên bắt đầu chuẩn bị tiệc" : "Đã hoàn thành phục vụ tiệc"));
        orders.saveAndFlush(order);
        emails.enqueue(order,target==OrderStatus.PREPARING ? "ORDER_PREPARING" : "ORDER_COMPLETED");
        return OrderResponse.fromEntity(order);
    }
}
