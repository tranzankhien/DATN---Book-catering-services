package com.banquethub.modules.reservations.service;

import com.banquethub.modules.orders.entity.Order;
import com.banquethub.modules.orders.entity.OrderStatus;
import com.banquethub.modules.orders.entity.OrderStatusHistory;
import com.banquethub.modules.orders.repository.OrderRepository;
import com.banquethub.modules.orders.repository.OrderStatusHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

@Component
public class ReservationExpiryScheduler {

    private static final Logger log = LoggerFactory.getLogger(ReservationExpiryScheduler.class);
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final StockReservationService reservationService;

    public ReservationExpiryScheduler(
            OrderRepository orderRepository,
            OrderStatusHistoryRepository statusHistoryRepository,
            StockReservationService reservationService
    ) {
        this.orderRepository = orderRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.reservationService = reservationService;
    }

    @Scheduled(fixedDelay = 60000) // Every 1 minute
    @Transactional
    public void cleanupExpiredReservations() {
        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);
        List<Order> expiredOrders = orderRepository.findByOrderStatusAndPaymentExpiresAtBefore(
                OrderStatus.PENDING_PAYMENT, now
        );

        if (expiredOrders.isEmpty()) {
            return;
        }

        log.info("Phát hiện {} đơn hàng quá hạn thanh toán 15 phút. Tiến hành giải phóng giữ kho...", expiredOrders.size());
        for (Order candidate : expiredOrders) {
            java.util.Optional<Order> lockedOpt = orderRepository.findByIdForUpdate(candidate.getId());
            if (lockedOpt.isEmpty()) {
                continue;
            }
            Order order = lockedOpt.get();
            if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
                continue;
            }

            order.setOrderStatus(OrderStatus.EXPIRED);
            orderRepository.save(order);

            // Record status history
            OrderStatusHistory history = new OrderStatusHistory(
                    order,
                    OrderStatus.PENDING_PAYMENT,
                    OrderStatus.EXPIRED,
                    null,
                    "SYSTEM",
                    "Hết hạn thời gian giữ nguyên liệu và thanh toán tiệc (15 phút)"
            );
            statusHistoryRepository.save(history);

            // Expire reservation
            reservationService.expireReservationForOrder(order.getId());
            log.info("Đã hủy và giải phóng tồn kho cho đơn hàng {} ({})", order.getOrderCode(), order.getId());
        }
    }
}
