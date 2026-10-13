package com.banquethub.modules.orders.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.catalog.entity.Dish;
import com.banquethub.modules.catalog.entity.DishStatus;
import com.banquethub.modules.catalog.entity.Ingredient;
import com.banquethub.modules.catalog.entity.RecipeItem;
import com.banquethub.modules.catalog.repository.DishRepository;
import com.banquethub.modules.catalog.repository.IngredientRepository;
import com.banquethub.modules.menus.entity.Menu;
import com.banquethub.modules.menus.entity.MenuItem;
import com.banquethub.modules.menus.entity.MenuStatus;
import com.banquethub.modules.menus.repository.MenuRepository;
import com.banquethub.modules.orders.dto.IngredientDemandPreview;
import com.banquethub.modules.orders.dto.OrderItemPreviewResponse;
import com.banquethub.modules.orders.dto.OrderPreviewItemRequest;
import com.banquethub.modules.orders.dto.OrderPreviewRequest;
import com.banquethub.modules.orders.dto.OrderPreviewResponse;
import com.banquethub.modules.reservations.repository.StockReservationRepository;
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
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class OrderPreviewService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final DishRepository dishRepository;
    private final MenuRepository menuRepository;
    private final IngredientRepository ingredientRepository;
    private final StockReservationRepository reservationRepository;

    public OrderPreviewService(
            DishRepository dishRepository,
            MenuRepository menuRepository,
            IngredientRepository ingredientRepository,
            StockReservationRepository reservationRepository
    ) {
        this.dishRepository = dishRepository;
        this.menuRepository = menuRepository;
        this.ingredientRepository = ingredientRepository;
        this.reservationRepository = reservationRepository;
    }

    @Transactional(readOnly = true)
    public OrderPreviewResponse previewOrder(OrderPreviewRequest request) {
        if (request.getTableCount() == null || request.getTableCount() <= 0) {
            throw new BusinessValidationException("Số lượng bàn tiệc phải từ 1 trở lên.");
        }
        if (request.getTableCount() > 500) {
            throw new BusinessValidationException("Số lượng bàn tiệc không được vượt quá 500 bàn.");
        }

        List<OrderPreviewItemRequest> itemRequests = request.getItems();
        String menuName = null;

        // If items are not provided directly, populate from Menu
        if ((itemRequests == null || itemRequests.isEmpty()) && request.getMenuId() != null) {
            Menu menu = menuRepository.findById(request.getMenuId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thực đơn ID: " + request.getMenuId()));
            if (menu.getStatus() != MenuStatus.ACTIVE) {
                throw new BusinessValidationException("Thực đơn '" + menu.getName() + "' hiện đang tạm ẩn hoặc ngừng phục vụ.");
            }
            menuName = menu.getName();
            itemRequests = menu.getMenuItems().stream()
                    .map(mi -> new OrderPreviewItemRequest(mi.getDish().getId(), mi.getQuantityPerTable()))
                    .toList();
        } else if (request.getMenuId() != null) {
            menuRepository.findById(request.getMenuId()).ifPresent(m -> {
                if (m.getStatus() != MenuStatus.ACTIVE) {
                    throw new BusinessValidationException("Thực đơn '" + m.getName() + "' hiện đang tạm ẩn hoặc ngừng phục vụ.");
                }
            });
        }

        if (itemRequests == null || itemRequests.isEmpty()) {
            throw new BusinessValidationException("Thực đơn đặt tiệc phải có ít nhất 1 món ăn.");
        }

        // Validate items and ensure no duplicates
        java.util.Set<Long> uniqueDishIds = new java.util.HashSet<>();
        for (OrderPreviewItemRequest ir : itemRequests) {
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
        List<Long> dishIds = itemRequests.stream().map(OrderPreviewItemRequest::getDishId).distinct().toList();
        Map<Long, Dish> dishMap = dishRepository.findAllById(dishIds).stream()
                .collect(Collectors.toMap(Dish::getId, Function.identity()));

        List<OrderItemPreviewResponse> itemPreviews = new ArrayList<>();
        BigDecimal pricePerTable = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;

        // Total demand per ingredient: ingredientId -> requiredQuantity
        Map<Long, BigDecimal> totalDemandMap = new HashMap<>();

        boolean canProceed = true;
        List<String> validationMessages = new ArrayList<>();

        for (OrderPreviewItemRequest itemReq : itemRequests) {
            Dish dish = dishMap.get(itemReq.getDishId());
            if (dish == null) {
                throw new ResourceNotFoundException("Không tìm thấy món ăn ID: " + itemReq.getDishId());
            }
            if (dish.getStatus() != DishStatus.ACTIVE) {
                canProceed = false;
                validationMessages.add(String.format("Món '%s' hiện đang ngừng phục vụ.", dish.getName()));
            }
            if (dish.getRecipeItems() == null || dish.getRecipeItems().isEmpty()) {
                canProceed = false;
                validationMessages.add(String.format("Món '%s' chưa có công thức định lượng nguyên liệu.", dish.getName()));
            }

            int qtyPerTable = itemReq.getQuantityPerTable();
            int totalQuantity = qtyPerTable * tableCount;
            BigDecimal linePricePerTable = dish.getPrice().multiply(BigDecimal.valueOf(qtyPerTable));
            BigDecimal lineTotal = dish.getPrice().multiply(BigDecimal.valueOf(totalQuantity));

            pricePerTable = pricePerTable.add(linePricePerTable);
            totalAmount = totalAmount.add(lineTotal);

            OrderItemPreviewResponse itemPreview = new OrderItemPreviewResponse();
            itemPreview.setDishId(dish.getId());
            itemPreview.setDishCode(dish.getCode());
            itemPreview.setDishName(dish.getName());
            itemPreview.setDishImageUrl(dish.getImageUrl());
            if (dish.getCategory() != null) {
                itemPreview.setCategoryName(dish.getCategory().getName());
            }
            itemPreview.setUnitPrice(dish.getPrice());
            itemPreview.setQuantityPerTable(qtyPerTable);
            itemPreview.setTotalQuantity(totalQuantity);
            itemPreview.setLineTotal(lineTotal);
            itemPreviews.add(itemPreview);

            // Compute ingredient demand from recipes
            if (dish.getRecipeItems() != null) {
                for (RecipeItem recipe : dish.getRecipeItems()) {
                    if (recipe.getIngredient() != null && recipe.getQuantity() != null) {
                        Long ingId = recipe.getIngredient().getId();
                        BigDecimal recipeDemand = recipe.getQuantity().multiply(BigDecimal.valueOf(totalQuantity));
                        totalDemandMap.merge(ingId, recipeDemand, BigDecimal::add);
                    }
                }
            }
        }

        // Query stock availability for demanded ingredients
        List<IngredientDemandPreview> demandPreviews = new ArrayList<>();
        if (!totalDemandMap.isEmpty()) {
            OffsetDateTime now = OffsetDateTime.now(VN_ZONE);
            List<Long> ingIds = new ArrayList<>(totalDemandMap.keySet());
            List<Ingredient> ingredients = ingredientRepository.findAllById(ingIds);
            Map<Long, Ingredient> ingredientMap = ingredients.stream()
                    .collect(Collectors.toMap(Ingredient::getId, Function.identity()));

            List<Object[]> activeReservedList = reservationRepository.getActiveReservedQuantitiesByIds(ingIds, now);
            Map<Long, BigDecimal> activeReservedMap = new HashMap<>();
            for (Object[] row : activeReservedList) {
                activeReservedMap.put((Long) row[0], (BigDecimal) row[1]);
            }

            for (Long ingId : ingIds) {
                Ingredient ing = ingredientMap.get(ingId);
                if (ing == null) continue;

                BigDecimal reqQty = totalDemandMap.get(ingId);
                BigDecimal physicalStock = ing.getCurrentStock();
                BigDecimal activeReserved = activeReservedMap.getOrDefault(ingId, BigDecimal.ZERO);
                BigDecimal availableStock = physicalStock.subtract(activeReserved);
                if (availableStock.compareTo(BigDecimal.ZERO) < 0) {
                    availableStock = BigDecimal.ZERO;
                }

                boolean sufficient = availableStock.compareTo(reqQty) >= 0;
                BigDecimal shortage = sufficient ? BigDecimal.ZERO : reqQty.subtract(availableStock);

                if (!sufficient) {
                    canProceed = false;
                    validationMessages.add(String.format("Nguyên liệu '%s' (%s) không đủ: cần %s %s, khả dụng chỉ còn %s %s (thiếu %s %s).",
                            ing.getName(), ing.getCode(),
                            reqQty.stripTrailingZeros().toPlainString(), ing.getUnit(),
                            availableStock.stripTrailingZeros().toPlainString(), ing.getUnit(),
                            shortage.stripTrailingZeros().toPlainString(), ing.getUnit()
                    ));
                }

                IngredientDemandPreview demandPreview = new IngredientDemandPreview();
                demandPreview.setIngredientId(ing.getId());
                demandPreview.setIngredientCode(ing.getCode());
                demandPreview.setIngredientName(ing.getName());
                demandPreview.setUnit(ing.getUnit());
                demandPreview.setRequiredQuantity(reqQty);
                demandPreview.setPhysicalStock(physicalStock);
                demandPreview.setActiveReservedStock(activeReserved);
                demandPreview.setAvailableStock(availableStock);
                demandPreview.setSufficient(sufficient);
                demandPreview.setShortageQuantity(shortage);
                demandPreviews.add(demandPreview);
            }
        }

        OrderPreviewResponse response = new OrderPreviewResponse();
        response.setMenuId(request.getMenuId());
        response.setMenuName(menuName);
        response.setTableCount(tableCount);
        response.setPricePerTable(pricePerTable);
        response.setTotalAmount(totalAmount);
        response.setItems(itemPreviews);
        response.setIngredientDemands(demandPreviews);
        response.setCanProceed(canProceed);
        response.setValidationMessages(validationMessages);

        return response;
    }
}
