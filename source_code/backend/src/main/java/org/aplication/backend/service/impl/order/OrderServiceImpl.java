package org.aplication.backend.service.impl.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import org.aplication.backend.common.constants.ErrorCode;
import org.aplication.backend.common.enums.OrderItemType;
import org.aplication.backend.common.enums.OrderStatus;
import org.aplication.backend.common.enums.ServiceLocation;
import org.aplication.backend.common.exception.CustomBusinessException;
import org.aplication.backend.dto.request.user.CreateOrderRequest;
import org.aplication.backend.dto.response.order.OrderResponse;
import org.aplication.backend.entity.auth.UserEntity;
import org.aplication.backend.entity.catalog.AdditionalServiceEntity;
import org.aplication.backend.entity.catalog.DishEntity;
import org.aplication.backend.entity.catalog.HallEntity;
import org.aplication.backend.entity.order.OrderEntity;
import org.aplication.backend.entity.order.OrderItemEntity;
import org.aplication.backend.mapper.order.OrderMapper;
import org.aplication.backend.repository.auth.UserRepository;
import org.aplication.backend.repository.catalog.AdditionalServiceRepository;
import org.aplication.backend.repository.catalog.DishRepository;
import org.aplication.backend.repository.catalog.HallRepository;
import org.aplication.backend.repository.order.OrderRepository;
import org.aplication.backend.service.interfaces.order.OrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderServiceImpl implements OrderService {
    private static final String ORDER_CODE_PREFIX = "TMP-";
    private static final DateTimeFormatter CODE_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(ZoneOffset.UTC);
    private final UserRepository userRepository;
    private final HallRepository hallRepository;
    private final DishRepository dishRepository;
    private final AdditionalServiceRepository serviceRepository;
    private final OrderRepository orderRepository;
    private final OrderMapper mapper;

    public OrderServiceImpl(UserRepository userRepository, HallRepository hallRepository, DishRepository dishRepository,
                            AdditionalServiceRepository serviceRepository, OrderRepository orderRepository, OrderMapper mapper) {
        this.userRepository = userRepository; this.hallRepository = hallRepository; this.dishRepository = dishRepository;
        this.serviceRepository = serviceRepository; this.orderRepository = orderRepository; this.mapper = mapper;
    }

    @Override
    @Transactional
    public OrderResponse create(UUID customerId, CreateOrderRequest request) {
        if (!request.eventEnd().isAfter(request.eventStart())) throw new CustomBusinessException(ErrorCode.ORDER_INVALID_TIME_RANGE);
        if (request.serviceLocation() == ServiceLocation.AT_RESTAURANT && request.hallId() == null) throw new CustomBusinessException(ErrorCode.HALL_NOT_FOUND);
        UserEntity customer = userRepository.findById(customerId).orElseThrow(() -> new CustomBusinessException(ErrorCode.RESOURCE_NOT_FOUND));
        HallEntity hall = request.hallId() == null ? null : hallRepository.findById(request.hallId()).filter(HallEntity::isActive)
                .orElseThrow(() -> new CustomBusinessException(ErrorCode.HALL_NOT_FOUND));
        OrderEntity order = new OrderEntity(ORDER_CODE_PREFIX + UUID.randomUUID(), customer, hall, request.serviceLocation(), request.eventStart(),
                request.eventEnd(), request.guestCount(), request.contactName(), request.contactPhone(), request.eventAddress(), request.note());
        BigDecimal total = BigDecimal.ZERO;
        for (var item : request.items()) {
            if (item.quantity() <= 0) throw new CustomBusinessException(ErrorCode.ORDER_EMPTY_ITEMS);
            String name; BigDecimal price;
            if (item.itemType() == OrderItemType.DISH) {
                DishEntity dish = dishRepository.findById(item.referenceId()).filter(DishEntity::isActive)
                        .orElseThrow(() -> new CustomBusinessException(ErrorCode.DISH_NOT_FOUND));
                name = dish.getName(); price = dish.getSalePrice();
            } else {
                AdditionalServiceEntity service = serviceRepository.findById(item.referenceId()).filter(AdditionalServiceEntity::isActive)
                        .orElseThrow(() -> new CustomBusinessException(ErrorCode.RESOURCE_NOT_FOUND));
                name = service.getName(); price = service.getPrice();
            }
            var line = new OrderItemEntity(item.itemType(), item.referenceId(), name, BigDecimal.valueOf(item.quantity()), price);
            order.addItem(line); total = total.add(line.getLineTotal());
        }
        order.setTotalAmount(total);
        order = orderRepository.save(order);
        return mapper.toResponse(order);
    }
    @Override @Transactional(readOnly = true)
    public List<OrderResponse> findMine(UUID customerId) { return orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId).stream().map(mapper::toResponse).toList(); }
    @Override @Transactional(readOnly = true)
    public OrderResponse findMineById(UUID customerId, UUID orderId) { return orderRepository.findByIdAndCustomerId(orderId, customerId).map(mapper::toResponse).orElseThrow(() -> new CustomBusinessException(ErrorCode.ORDER_NOT_FOUND)); }
    @Override @Transactional(readOnly = true)
    public List<OrderResponse> findAll(OrderStatus status) {
        var orders = status == null ? orderRepository.findAllByOrderByCreatedAtDesc() : orderRepository.findByStatusOrderByCreatedAtDesc(status);
        return orders.stream().map(mapper::toResponse).toList();
    }
    @Override @Transactional
    public OrderResponse changeStatus(UUID orderId, OrderStatus status) {
        var order = orderRepository.findById(orderId).orElseThrow(() -> new CustomBusinessException(ErrorCode.ORDER_NOT_FOUND));
        order.changeStatus(status);
        return mapper.toResponse(orderRepository.save(order));
    }
}
