package com.banquethub.modules.reservations.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.catalog.entity.Ingredient;
import com.banquethub.modules.catalog.repository.IngredientRepository;
import com.banquethub.modules.orders.entity.Order;
import com.banquethub.modules.reservations.dto.StockAvailabilityResponse;
import com.banquethub.modules.reservations.dto.StockReservationResponse;
import com.banquethub.modules.reservations.entity.ReservationStatus;
import com.banquethub.modules.reservations.entity.StockReservation;
import com.banquethub.modules.reservations.entity.StockReservationItem;
import com.banquethub.modules.reservations.repository.StockReservationRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class StockReservationService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final StockReservationRepository reservationRepository;
    private final IngredientRepository ingredientRepository;

    public StockReservationService(
            StockReservationRepository reservationRepository,
            IngredientRepository ingredientRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.ingredientRepository = ingredientRepository;
    }

    @Transactional(readOnly = true)
    public BigDecimal getAvailableStock(Long ingredientId) {
        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);
        Ingredient ingredient = ingredientRepository.findById(ingredientId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nguyên liệu ID: " + ingredientId));
        BigDecimal physicalStock = ingredient.getCurrentStock();
        BigDecimal reservedStock = reservationRepository.getActiveReservedQuantity(ingredientId, now);
        BigDecimal available = physicalStock.subtract(reservedStock);
        return available.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : available;
    }

    @Transactional(readOnly = true)
    public Map<Long, BigDecimal> getAvailableStocks(List<Long> ingredientIds) {
        if (ingredientIds == null || ingredientIds.isEmpty()) {
            return Collections.emptyMap();
        }
        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);
        List<Ingredient> ingredients = ingredientRepository.findAllById(ingredientIds);
        List<Object[]> reservedList = reservationRepository.getActiveReservedQuantitiesByIds(ingredientIds, now);

        Map<Long, BigDecimal> reservedMap = new HashMap<>();
        for (Object[] row : reservedList) {
            if (row != null && row.length >= 2 && row[0] != null) {
                Long ingId = row[0] instanceof Number ? ((Number) row[0]).longValue() : Long.valueOf(row[0].toString());
                BigDecimal resQty = BigDecimal.ZERO;
                if (row[1] instanceof BigDecimal) {
                    resQty = (BigDecimal) row[1];
                } else if (row[1] instanceof Number) {
                    resQty = BigDecimal.valueOf(((Number) row[1]).doubleValue());
                }
                reservedMap.put(ingId, resQty);
            }
        }

        Map<Long, BigDecimal> availableMap = new HashMap<>();
        for (Ingredient ing : ingredients) {
            BigDecimal physical = ing.getCurrentStock();
            BigDecimal reserved = reservedMap.getOrDefault(ing.getId(), BigDecimal.ZERO);
            BigDecimal available = physical.subtract(reserved);
            availableMap.put(ing.getId(), available.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : available);
        }
        return availableMap;
    }

    @Transactional(readOnly = true)
    public List<StockAvailabilityResponse> getStockAvailabilityList() {
        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);
        List<Ingredient> ingredients = ingredientRepository.findByActiveTrueOrderByNameAsc();
        if (ingredients.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> ids = ingredients.stream().map(Ingredient::getId).toList();
        List<Object[]> reservedList = reservationRepository.getActiveReservedQuantitiesByIds(ids, now);
        Map<Long, BigDecimal> reservedMap = new HashMap<>();
        for (Object[] row : reservedList) {
            if (row != null && row.length >= 2 && row[0] != null) {
                Long ingId = row[0] instanceof Number ? ((Number) row[0]).longValue() : Long.valueOf(row[0].toString());
                BigDecimal resQty = BigDecimal.ZERO;
                if (row[1] instanceof BigDecimal) {
                    resQty = (BigDecimal) row[1];
                } else if (row[1] instanceof Number) {
                    resQty = BigDecimal.valueOf(((Number) row[1]).doubleValue());
                }
                reservedMap.put(ingId, resQty);
            }
        }

        List<StockAvailabilityResponse> result = new ArrayList<>();
        for (Ingredient ing : ingredients) {
            BigDecimal physical = ing.getCurrentStock();
            BigDecimal reserved = reservedMap.getOrDefault(ing.getId(), BigDecimal.ZERO);
            BigDecimal available = physical.subtract(reserved);
            if (available.compareTo(BigDecimal.ZERO) < 0) {
                available = BigDecimal.ZERO;
            }
            boolean isLow = available.compareTo(ing.getMinStockThreshold()) <= 0;

            result.add(new StockAvailabilityResponse(
                    ing.getId(),
                    ing.getCode(),
                    ing.getName(),
                    ing.getUnit(),
                    physical,
                    reserved,
                    available,
                    ing.getMinStockThreshold(),
                    isLow
            ));
        }
        return result;
    }

    @Transactional
    public StockReservation checkAndReserveStock(Order order, Map<Long, BigDecimal> requiredIngredients) {
        if (requiredIngredients == null || requiredIngredients.isEmpty()) {
            return null;
        }

        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);
        List<Long> sortedIds = requiredIngredients.keySet().stream().sorted().toList();

        // 1. Lock ingredients row-by-row in ascending order (PESSIMISTIC_WRITE) - BR-14
        List<Ingredient> lockedIngredients = ingredientRepository.findAllByIdInForUpdate(sortedIds);
        Map<Long, Ingredient> ingredientMap = lockedIngredients.stream()
                .collect(Collectors.toMap(Ingredient::getId, Function.identity()));

        // 2. Query active reserved stock for locked ingredients
        List<Object[]> reservedRows = reservationRepository.getActiveReservedQuantitiesByIds(sortedIds, now);
        Map<Long, BigDecimal> activeReservedMap = new HashMap<>();
        for (Object[] row : reservedRows) {
            activeReservedMap.put((Long) row[0], (BigDecimal) row[1]);
        }

        // 3. Verify availability for every required ingredient
        List<String> shortages = new ArrayList<>();
        for (Long ingId : sortedIds) {
            Ingredient ing = ingredientMap.get(ingId);
            if (ing == null) {
                throw new ResourceNotFoundException("Không tìm thấy nguyên liệu ID: " + ingId);
            }
            BigDecimal required = requiredIngredients.get(ingId);
            BigDecimal physical = ing.getCurrentStock();
            BigDecimal currentReserved = activeReservedMap.getOrDefault(ingId, BigDecimal.ZERO);
            BigDecimal available = physical.subtract(currentReserved);

            if (available.compareTo(required) < 0) {
                shortages.add(String.format("- %s (%s): Cần %s %s, tồn khả dụng còn %s %s (tồn thực tế: %s, đang giữ: %s)",
                        ing.getName(), ing.getCode(),
                        required.stripTrailingZeros().toPlainString(), ing.getUnit(),
                        available.compareTo(BigDecimal.ZERO) < 0 ? "0" : available.stripTrailingZeros().toPlainString(), ing.getUnit(),
                        physical.stripTrailingZeros().toPlainString(),
                        currentReserved.stripTrailingZeros().toPlainString()
                ));
            }
        }

        if (!shortages.isEmpty()) {
            throw new BusinessValidationException(
                    "Không thể tạo đơn đặt tiệc vì kho không đủ nguyên liệu khả dụng:\n" +
                    String.join("\n", shortages)
            );
        }

        // 4. Create StockReservation
        StockReservation reservation = new StockReservation();
        reservation.setOrder(order);
        reservation.setStatus(ReservationStatus.ACTIVE);
        reservation.setExpiresAt(order.getPaymentExpiresAt());

        for (Long ingId : sortedIds) {
            Ingredient ing = ingredientMap.get(ingId);
            BigDecimal reqQty = requiredIngredients.get(ingId);
            StockReservationItem item = new StockReservationItem(reservation, ing, reqQty, ing.getUnit());
            reservation.addItem(item);
        }

        return reservationRepository.save(reservation);
    }

    @Transactional
    public void releaseReservationForOrder(Long orderId) {
        Optional<StockReservation> opt = reservationRepository.findByOrderId(orderId);
        if (opt.isPresent()) {
            StockReservation res = opt.get();
            if (res.getStatus() == ReservationStatus.ACTIVE) {
                res.release();
                reservationRepository.save(res);
            }
        }
    }

    @Transactional
    public void expireReservationForOrder(Long orderId) {
        Optional<StockReservation> opt = reservationRepository.findByOrderId(orderId);
        if (opt.isPresent()) {
            StockReservation res = opt.get();
            if (res.getStatus() == ReservationStatus.ACTIVE) {
                res.expire();
                reservationRepository.save(res);
            }
        }
    }

    @Transactional(readOnly = true)
    public Page<StockReservationResponse> searchAdminReservations(String keyword, ReservationStatus status, Pageable pageable) {
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        return reservationRepository.searchReservations(kw, status, pageable)
                .map(StockReservationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Optional<StockReservationResponse> getReservationByOrderId(Long orderId) {
        return reservationRepository.findByOrderId(orderId)
                .map(StockReservationResponse::fromEntity);
    }
}
