package com.banquethub.modules.orders.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.catalog.entity.Dish;
import com.banquethub.modules.catalog.entity.DishStatus;
import com.banquethub.modules.catalog.entity.RecipeItem;
import com.banquethub.modules.catalog.repository.DishRepository;
import com.banquethub.modules.menus.entity.Menu;
import com.banquethub.modules.menus.entity.MenuStatus;
import com.banquethub.modules.menus.repository.MenuRepository;
import com.banquethub.modules.orders.dto.CancelOrderRequest;
import com.banquethub.modules.orders.dto.CreateOrderItemRequest;
import com.banquethub.modules.orders.dto.CreateOrderRequest;
import com.banquethub.modules.orders.dto.OrderResponse;
import com.banquethub.modules.orders.entity.Order;
import com.banquethub.modules.orders.entity.OrderItem;
import com.banquethub.modules.orders.entity.OrderStatus;
import com.banquethub.modules.orders.entity.OrderStatusHistory;
import com.banquethub.modules.orders.entity.PaymentStatus;
import com.banquethub.modules.orders.repository.OrderRepository;
import com.banquethub.modules.orders.repository.OrderStatusHistoryRepository;
import com.banquethub.modules.reservations.dto.StockReservationResponse;
import com.banquethub.modules.reservations.entity.StockReservation;
import com.banquethub.modules.reservations.service.StockReservationService;
import com.banquethub.modules.users.entity.Role;
import com.banquethub.modules.users.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final java.util.concurrent.ConcurrentMap<String, Object> idempotencyLocks = new java.util.concurrent.ConcurrentHashMap<>();

    private final OrderRepository orderRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final DishRepository dishRepository;
    private final MenuRepository menuRepository;
    private final StockReservationService reservationService;
    private final TransactionTemplate transactionTemplate;

    public OrderService(
            OrderRepository orderRepository,
            OrderStatusHistoryRepository statusHistoryRepository,
            DishRepository dishRepository,
            MenuRepository menuRepository,
            StockReservationService reservationService,
            PlatformTransactionManager transactionManager
    ) {
        this.orderRepository = orderRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.dishRepository = dishRepository;
        this.menuRepository = menuRepository;
        this.reservationService = reservationService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    public OrderResponse createOrder(CreateOrderRequest request, User currentUser) {
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().trim().isEmpty()) {
            String key = request.getIdempotencyKey().trim();
            Object lock = idempotencyLocks.computeIfAbsent(key, k -> new Object());
            synchronized (lock) {
                try {
                    return transactionTemplate.execute(status -> doCreateOrder(request, currentUser));
                } finally {
                    idempotencyLocks.remove(key, lock);
                }
            }
        }
        return transactionTemplate.execute(status -> doCreateOrder(request, currentUser));
    }

    private OrderResponse doCreateOrder(CreateOrderRequest request, User currentUser) {
        if (currentUser == null) {
            throw new BusinessValidationException("Vui lòng đăng nhập để đặt tiệc.");
        }
        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);

        // 1. Idempotency Check (BR-13)
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().trim().isEmpty()) {
            Optional<Order> existing = orderRepository.findByIdempotencyKey(request.getIdempotencyKey().trim());
            if (existing.isPresent()) {
                Order existingOrder = existing.get();
                // Ràng buộc key theo tài khoản người dùng
                if (existingOrder.getUser() != null && !existingOrder.getUser().getId().equals(currentUser.getId())) {
                    throw new BusinessValidationException("Idempotency key không thuộc về tài khoản hiện tại.");
                }
                // Trả lỗi nếu cùng key nhưng nội dung khác
                boolean sameMenu = (existingOrder.getMenu() == null && request.getMenuId() == null) ||
                        (existingOrder.getMenu() != null && existingOrder.getMenu().getId().equals(request.getMenuId()));
                boolean sameTableCount = existingOrder.getTableCount() != null && existingOrder.getTableCount().equals(request.getTableCount());
                if (!sameMenu || !sameTableCount) {
                    throw new BusinessValidationException("Idempotency-Key đã được sử dụng với nội dung đặt tiệc khác.");
                }

                OrderResponse resp = OrderResponse.fromEntity(existingOrder);
                reservationService.getReservationByOrderId(existingOrder.getId()).ifPresent(resp::setReservation);
                return resp;
            }
        }

        // 2. Validate Event Time & Table Count
        if (request.getEventDateTime() == null || request.getEventDateTime().isBefore(now)) {
            throw new BusinessValidationException("Thời gian tổ chức tiệc phải là thời điểm trong tương lai.");
        }
        if (request.getTableCount() == null || request.getTableCount() <= 0) {
            throw new BusinessValidationException("Số lượng bàn tiệc phải từ 1 trở lên.");
        }
        if (request.getTableCount() > 500) {
            throw new BusinessValidationException("Số lượng bàn tiệc không được vượt quá 500 bàn.");
        }

        List<CreateOrderItemRequest> itemRequests = request.getItems();
        Menu selectedMenu = null;
        String menuNameSnapshot = null;

        if (request.getMenuId() != null) {
            selectedMenu = menuRepository.findById(request.getMenuId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thực đơn ID: " + request.getMenuId()));
            if (selectedMenu.getStatus() != MenuStatus.ACTIVE) {
                throw new BusinessValidationException("Thực đơn '" + selectedMenu.getName() + "' hiện đang tạm ẩn hoặc ngừng phục vụ.");
            }
            menuNameSnapshot = selectedMenu.getName();

            if (itemRequests == null || itemRequests.isEmpty()) {
                itemRequests = selectedMenu.getMenuItems().stream()
                        .map(mi -> new CreateOrderItemRequest(mi.getDish().getId(), mi.getQuantityPerTable()))
                        .toList();
            }
        }

        if (itemRequests == null || itemRequests.isEmpty()) {
            throw new BusinessValidationException("Đơn đặt tiệc phải có ít nhất 1 món ăn.");
        }

        // Validate items and ensure no duplicates
        Set<Long> uniqueDishIds = new HashSet<>();
        for (CreateOrderItemRequest ir : itemRequests) {
            if (ir.getDishId() == null) {
                throw new BusinessValidationException("Món ăn không được để trống.");
            }
            if (ir.getQuantityPerTable() == null || ir.getQuantityPerTable() <= 0) {
                throw new BusinessValidationException("Số lượng món mỗi bàn phải từ 1 trở lên.");
            }
            if (ir.getQuantityPerTable() > 100) {
                throw new BusinessValidationException("Số lượng món mỗi bàn không được vượt quá 100 phần.");
            }
            if (!uniqueDishIds.add(ir.getDishId())) {
                throw new BusinessValidationException("Món ăn không được trùng lặp trong cùng một đơn đặt tiệc.");
            }
        }

        int tableCount = request.getTableCount();
        List<Long> dishIds = itemRequests.stream().map(CreateOrderItemRequest::getDishId).toList();
        Map<Long, Dish> dishMap = dishRepository.findAllById(dishIds).stream()
                .collect(Collectors.toMap(Dish::getId, Function.identity()));

        BigDecimal totalAmount = BigDecimal.ZERO;
        Map<Long, BigDecimal> totalDemandMap = new HashMap<>();
        List<OrderItem> orderItems = new ArrayList<>();

        for (CreateOrderItemRequest ir : itemRequests) {
            Dish dish = dishMap.get(ir.getDishId());
            if (dish == null) {
                throw new ResourceNotFoundException("Không tìm thấy món ăn ID: " + ir.getDishId());
            }
            if (dish.getStatus() != DishStatus.ACTIVE) {
                throw new BusinessValidationException("Món '" + dish.getName() + "' hiện đang ngừng phục vụ, không thể đặt tiệc.");
            }
            if (dish.getRecipeItems() == null || dish.getRecipeItems().isEmpty()) {
                throw new BusinessValidationException("Món '" + dish.getName() + "' chưa có công thức định lượng nguyên liệu, không thể kiểm tra tồn kho.");
            }

            int qtyPerTable = ir.getQuantityPerTable();
            int totalQty = qtyPerTable * tableCount;
            BigDecimal lineTotal = dish.getPrice().multiply(BigDecimal.valueOf(totalQty));
            totalAmount = totalAmount.add(lineTotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setDish(dish);
            orderItem.setDishNameSnapshot(dish.getName());
            orderItem.setUnitPriceSnapshot(dish.getPrice());
            orderItem.setQuantityPerTable(qtyPerTable);
            orderItem.setTotalQuantity(totalQty);
            orderItem.setLineTotal(lineTotal);
            orderItems.add(orderItem);

            // Calculate ingredient demands (BR-04)
            for (RecipeItem recipe : dish.getRecipeItems()) {
                if (recipe.getIngredient() != null && recipe.getQuantity() != null) {
                    Long ingId = recipe.getIngredient().getId();
                    BigDecimal recipeDemand = recipe.getQuantity().multiply(BigDecimal.valueOf(totalQty));
                    totalDemandMap.merge(ingId, recipeDemand, BigDecimal::add);
                }
            }
        }

        // 3. Generate Order Code
        Long seq = orderRepository.getNextOrderCodeSeq();
        String datePart = LocalDate.now(VN_ZONE).format(DATE_FORMATTER);
        String orderCode = String.format("ORD-%s-%04d", datePart, seq);

        // 4. Build Order Entity
        Order order = new Order();
        order.setOrderCode(orderCode);
        order.setUser(currentUser);
        order.setCustomerName(request.getCustomerName().trim());
        order.setCustomerPhone(request.getCustomerPhone().trim());
        order.setCustomerEmail(request.getCustomerEmail().trim());
        order.setEventDateTime(request.getEventDateTime());
        order.setTableCount(tableCount);
        order.setNote(request.getNote());
        order.setEventLocation(request.getEventLocation() != null ? request.getEventLocation().trim() : null);
        order.setGuestCount(request.getGuestCount());
        order.setMenu(selectedMenu);
        order.setMenuNameSnapshot(menuNameSnapshot);
        order.setTotalAmount(totalAmount);
        order.setOrderStatus(OrderStatus.PENDING_PAYMENT);
        order.setPaymentStatus(PaymentStatus.UNPAID);
        order.setPaymentExpiresAt(now.plusMinutes(15)); // BR-07
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().trim().isEmpty()) {
            order.setIdempotencyKey(request.getIdempotencyKey().trim());
        }

        for (OrderItem oi : orderItems) {
            order.addItem(oi);
        }

        // 5. Initial Status History
        String changedByName = currentUser != null ? currentUser.getFullName() : order.getCustomerName();
        OrderStatusHistory history = new OrderStatusHistory(
                order,
                null,
                OrderStatus.PENDING_PAYMENT,
                currentUser,
                changedByName,
                "Khách hàng xác nhận tạo đơn đặt tiệc thành công. Hệ thống giữ nguyên liệu trong 15 phút để chờ thanh toán."
        );
        order.addStatusHistory(history);

        Order savedOrder = orderRepository.save(order);

        // 6. Check and reserve stock atomically with pessimistic row-locking (BR-05, BR-06, BR-14)
        StockReservation reservation = reservationService.checkAndReserveStock(savedOrder, totalDemandMap);

        OrderResponse response = OrderResponse.fromEntity(savedOrder);
        if (reservation != null) {
            response.setReservation(StockReservationResponse.fromEntity(reservation));
        }
        return response;
    }

    @Transactional(readOnly = true)
    public OrderResponse getExistingByIdempotencyKey(String idempotencyKey, User currentUser) {
        return orderRepository.findByIdempotencyKey(idempotencyKey)
                .map(existingOrder -> {
                    if (currentUser != null && existingOrder.getUser() != null && !existingOrder.getUser().getId().equals(currentUser.getId())) {
                        throw new BusinessValidationException("Idempotency key không thuộc về tài khoản hiện tại.");
                    }
                    OrderResponse resp = OrderResponse.fromEntity(existingOrder);
                    reservationService.getReservationByOrderId(existingOrder.getId()).ifPresent(resp::setReservation);
                    return resp;
                })
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getUserOrders(User user, OrderStatus status, Pageable pageable) {
        if (user == null) {
            throw new BusinessValidationException("Vui lòng đăng nhập để xem lịch sử đơn hàng.");
        }
        return orderRepository.findUserOrders(user.getId(), status, pageable)
                .map(order -> {
                    OrderResponse resp = OrderResponse.fromEntity(order);
                    reservationService.getReservationByOrderId(order.getId()).ifPresent(resp::setReservation);
                    return resp;
                });
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id, User currentUser) {
        if (currentUser == null) {
            throw new BusinessValidationException("Vui lòng đăng nhập để xem thông tin đơn hàng.");
        }
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));

        // Authorization check:
        // Admin: can view any order.
        // User: can only view their own orders.
        // Employee: can only view PENDING_PAYMENT orders.
        if (currentUser.getRole() == Role.ROLE_USER) {
            if (order.getUser() == null || !order.getUser().getId().equals(currentUser.getId())) {
                throw new BusinessValidationException("Bạn không có quyền truy cập đơn hàng của người khác.");
            }
        } else if (currentUser.getRole() == Role.ROLE_EMPLOYEE) {
            if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
                throw new BusinessValidationException("Nhân viên chỉ có quyền xem đơn tiệc ở trạng thái chờ xử lý (PENDING_PAYMENT).");
            }
        }

        OrderResponse resp = OrderResponse.fromEntity(order);
        reservationService.getReservationByOrderId(order.getId()).ifPresent(resp::setReservation);
        return resp;
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByCode(String orderCode, User currentUser) {
        if (currentUser == null) {
            throw new BusinessValidationException("Vui lòng đăng nhập để xem thông tin đơn hàng.");
        }
        Order order = orderRepository.findByOrderCodeIgnoreCase(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với mã: " + orderCode));

        if (currentUser.getRole() == Role.ROLE_USER) {
            if (order.getUser() == null || !order.getUser().getId().equals(currentUser.getId())) {
                throw new BusinessValidationException("Bạn không có quyền truy cập đơn hàng của người khác.");
            }
        } else if (currentUser.getRole() == Role.ROLE_EMPLOYEE) {
            if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
                throw new BusinessValidationException("Nhân viên chỉ có quyền xem đơn tiệc ở trạng thái chờ xử lý (PENDING_PAYMENT).");
            }
        }

        OrderResponse resp = OrderResponse.fromEntity(order);
        reservationService.getReservationByOrderId(order.getId()).ifPresent(resp::setReservation);
        return resp;
    }

    @Transactional
    public OrderResponse cancelOrder(Long id, CancelOrderRequest request, User currentUser) {
        if (currentUser == null) {
            throw new BusinessValidationException("Vui lòng đăng nhập để thực hiện thao tác hủy đơn.");
        }
        if (currentUser.getRole() == Role.ROLE_EMPLOYEE) {
            throw new BusinessValidationException("Nhân viên không có quyền hủy đơn hàng của khách hàng.");
        }

        // Lock order row to synchronize concurrent cancel and expiry scheduler
        Order order = orderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + id));

        // Check ownership for customer
        if (currentUser.getRole() == Role.ROLE_USER) {
            if (order.getUser() == null || !order.getUser().getId().equals(currentUser.getId())) {
                throw new BusinessValidationException("Bạn không có quyền hủy đơn hàng của người khác.");
            }
        }

        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);
        // Expiry check: if past paymentExpiresAt or already EXPIRED
        if (order.getOrderStatus() == OrderStatus.EXPIRED || (order.getPaymentExpiresAt() != null && order.getPaymentExpiresAt().isBefore(now))) {
            if (order.getOrderStatus() == OrderStatus.PENDING_PAYMENT) {
                order.setOrderStatus(OrderStatus.EXPIRED);
                orderRepository.save(order);
                reservationService.expireReservationForOrder(order.getId());
            }
            throw new BusinessValidationException("Đơn hàng đã hết hạn giữ chỗ và không thể hủy.");
        }

        if (order.getOrderStatus() == OrderStatus.CANCELLED) {
            throw new BusinessValidationException("Đơn hàng đã ở trạng thái hủy trước đó.");
        }
        if (order.getOrderStatus() == OrderStatus.COMPLETED) {
            throw new BusinessValidationException("Đơn hàng đã hoàn thành, không thể hủy.");
        }

        // Only PENDING_PAYMENT orders can be cancelled in Phase 3
        if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BusinessValidationException("Chỉ có thể hủy đơn hàng đang ở trạng thái 'Chờ thanh toán'. Trạng thái hiện tại: " + order.getOrderStatus());
        }

        OrderStatus fromStatus = order.getOrderStatus();
        order.setOrderStatus(OrderStatus.CANCELLED);

        String reason = (request != null && request.getReason() != null && !request.getReason().trim().isEmpty())
                ? request.getReason().trim() : "Khách hàng yêu cầu hủy đơn trước khi thanh toán";
        String changedByName = currentUser.getFullName();

        OrderStatusHistory history = new OrderStatusHistory(
                order,
                fromStatus,
                OrderStatus.CANCELLED,
                currentUser,
                changedByName,
                reason
        );
        statusHistoryRepository.save(history);

        // Immediately release reserved stock (BR-08)
        reservationService.releaseReservationForOrder(order.getId());

        Order saved = orderRepository.save(order);
        OrderResponse resp = OrderResponse.fromEntity(saved);
        reservationService.getReservationByOrderId(saved.getId()).ifPresent(resp::setReservation);
        return resp;
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> searchAdminOrders(
            String keyword,
            OrderStatus orderStatus,
            PaymentStatus paymentStatus,
            OffsetDateTime fromDate,
            OffsetDateTime toDate,
            Pageable pageable
    ) {
        org.springframework.data.jpa.domain.Specification<Order> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                jakarta.persistence.criteria.Predicate codePred = cb.like(cb.lower(root.get("orderCode")), pattern);
                jakarta.persistence.criteria.Predicate namePred = cb.like(cb.lower(root.get("customerName")), pattern);
                jakarta.persistence.criteria.Predicate phonePred = cb.like(cb.lower(root.get("customerPhone")), pattern);
                jakarta.persistence.criteria.Predicate emailPred = cb.like(cb.lower(root.get("customerEmail")), pattern);
                predicates.add(cb.or(codePred, namePred, phonePred, emailPred));
            }
            if (orderStatus != null) {
                predicates.add(cb.equal(root.get("orderStatus"), orderStatus));
            }
            if (paymentStatus != null) {
                predicates.add(cb.equal(root.get("paymentStatus"), paymentStatus));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }
            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return orderRepository.findAll(spec, pageable)
                .map(order -> {
                    OrderResponse resp = OrderResponse.fromEntity(order);
                    reservationService.getReservationByOrderId(order.getId()).ifPresent(resp::setReservation);
                    return resp;
                });
    }

    private boolean isAdminOrEmployee(User user) {
        return user.getRole() == Role.ROLE_ADMIN || user.getRole() == Role.ROLE_EMPLOYEE;
    }
}
