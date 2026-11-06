package com.banquethub.modules.ai.service;

import com.banquethub.modules.ai.dto.AiMenuRecommendationRequest;
import com.banquethub.modules.ai.dto.AvailabilityStatus;
import com.banquethub.modules.ai.dto.BudgetStatus;
import com.banquethub.modules.ai.dto.BudgetType;
import com.banquethub.modules.ai.dto.MenuSuggestionDto;
import com.banquethub.modules.ai.dto.MenuSuggestionItemDto;
import com.banquethub.modules.catalog.entity.Dish;
import com.banquethub.modules.catalog.entity.DishStatus;
import com.banquethub.modules.catalog.entity.Ingredient;
import com.banquethub.modules.catalog.entity.RecipeItem;
import com.banquethub.modules.catalog.repository.DishRepository;
import com.banquethub.modules.catalog.repository.IngredientRepository;
import com.banquethub.modules.reservations.service.StockReservationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RecommendationValidationService {

    private final DishRepository dishRepository;
    private final IngredientRepository ingredientRepository;
    private final StockReservationService reservationService;

    public RecommendationValidationService(
            DishRepository dishRepository,
            IngredientRepository ingredientRepository,
            StockReservationService reservationService
    ) {
        this.dishRepository = dishRepository;
        this.ingredientRepository = ingredientRepository;
        this.reservationService = reservationService;
    }

    @Transactional(readOnly = true)
    public List<MenuSuggestionDto> validateAndEnrichSuggestions(
            List<GeminiClientService.RawAiSuggestion> rawSuggestions,
            AiMenuRecommendationRequest request
    ) {
        if (rawSuggestions == null || rawSuggestions.isEmpty()) {
            return new ArrayList<>();
        }

        int tableCount = request.getTableCount();

        // Calculate max allowed budget per table if budget is set
        BigDecimal maxBudgetPerTable = null;
        if (request.getBudgetAmount() != null && request.getBudgetAmount().signum() > 0) {
            if (request.getBudgetType() == BudgetType.TOTAL_ORDER) {
                maxBudgetPerTable = request.getBudgetAmount().divide(BigDecimal.valueOf(tableCount), 2, RoundingMode.HALF_UP);
            } else {
                maxBudgetPerTable = request.getBudgetAmount();
            }
        }

        // Collect all distinct dish IDs across all raw suggestions
        Set<Long> allDishIds = new HashSet<>();
        for (GeminiClientService.RawAiSuggestion raw : rawSuggestions) {
            if (raw.items() != null) {
                for (GeminiClientService.RawAiItem item : raw.items()) {
                    if (item.dishId() != null) {
                        allDishIds.add(item.dishId());
                    }
                }
            }
        }

        Map<Long, Dish> dishMap = dishRepository.findAllById(allDishIds).stream()
                .filter(d -> d.getStatus() == DishStatus.ACTIVE && d.getRecipeItems() != null && !d.getRecipeItems().isEmpty())
                .collect(Collectors.toMap(Dish::getId, Function.identity()));

        List<MenuSuggestionDto> validatedSuggestions = new ArrayList<>();

        for (GeminiClientService.RawAiSuggestion raw : rawSuggestions) {
            if (validatedSuggestions.size() >= 3) {
                break; // Limit to max 3 suggestions
            }

            if (raw.items() == null || raw.items().isEmpty()) {
                continue;
            }

            // Deduplicate items within the same menu suggestion
            Map<Long, Integer> itemQuantities = new LinkedHashMap<>();
            for (GeminiClientService.RawAiItem rawItem : raw.items()) {
                if (rawItem.dishId() == null) continue;
                Dish dish = dishMap.get(rawItem.dishId());
                if (dish == null) continue; // Ignore dishes not in DB or inactive

                int qty = rawItem.quantityPerTable() != null && rawItem.quantityPerTable() > 0
                        ? Math.min(rawItem.quantityPerTable(), 10)
                        : 1;

                itemQuantities.merge(dish.getId(), qty, Integer::sum);
            }

            if (itemQuantities.isEmpty()) {
                continue;
            }

            // Calculate prices from database
            BigDecimal totalPerTable = BigDecimal.ZERO;
            List<MenuSuggestionItemDto> itemDtos = new ArrayList<>();

            // Ingredient demands for this suggestion: ingredientId -> total quantity needed
            Map<Long, BigDecimal> ingredientDemandMap = new HashMap<>();

            for (Map.Entry<Long, Integer> entry : itemQuantities.entrySet()) {
                Dish dish = dishMap.get(entry.getKey());
                int qtyPerTable = entry.getValue();
                BigDecimal unitPrice = dish.getPrice();
                BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(qtyPerTable));

                totalPerTable = totalPerTable.add(lineTotal);

                MenuSuggestionItemDto itemDto = new MenuSuggestionItemDto(
                        dish.getId(),
                        dish.getCode(),
                        dish.getName(),
                        dish.getImageUrl(),
                        dish.getCategory() != null ? dish.getCategory().getName() : "Món tiệc",
                        qtyPerTable,
                        unitPrice,
                        lineTotal
                );
                itemDtos.add(itemDto);

                // Calculate ingredient demand
                int totalPortions = qtyPerTable * tableCount;
                for (RecipeItem recipe : dish.getRecipeItems()) {
                    if (recipe.getIngredient() != null && recipe.getQuantity() != null) {
                        Long ingId = recipe.getIngredient().getId();
                        BigDecimal demand = recipe.getQuantity().multiply(BigDecimal.valueOf(totalPortions));
                        ingredientDemandMap.merge(ingId, demand, BigDecimal::add);
                    }
                }
            }

            BigDecimal totalOrderAmount = totalPerTable.multiply(BigDecimal.valueOf(tableCount));

            // Budget validation
            BudgetStatus budgetStatus;
            if (maxBudgetPerTable == null) {
                budgetStatus = BudgetStatus.NO_BUDGET_SET;
            } else if (totalPerTable.compareTo(maxBudgetPerTable) <= 0) {
                budgetStatus = BudgetStatus.WITHIN_BUDGET;
            } else {
                budgetStatus = BudgetStatus.OVER_BUDGET;
            }

            // Stock Availability Check (Independent per suggestion, no reservations made)
            AvailabilityStatus availabilityStatus = AvailabilityStatus.AVAILABLE;
            List<String> validationMessages = new ArrayList<>();

            if (!ingredientDemandMap.isEmpty()) {
                List<Long> ingIds = new ArrayList<>(ingredientDemandMap.keySet());
                Map<Long, BigDecimal> availableStockMap = reservationService.getAvailableStocks(ingIds);
                Map<Long, Ingredient> ingredientEntityMap = ingredientRepository.findAllById(ingIds).stream()
                        .collect(Collectors.toMap(Ingredient::getId, Function.identity()));

                for (Long ingId : ingIds) {
                    BigDecimal needed = ingredientDemandMap.get(ingId);
                    BigDecimal available = availableStockMap.getOrDefault(ingId, BigDecimal.ZERO);

                    if (available.compareTo(needed) < 0) {
                        availabilityStatus = AvailabilityStatus.PARTIAL_SHORTAGE;
                        Ingredient ing = ingredientEntityMap.get(ingId);
                        String ingName = ing != null ? ing.getName() : "NVL #" + ingId;
                        String unit = ing != null ? ing.getUnit() : "";
                        validationMessages.add(String.format("Nguyên liệu '%s' cần %s %s nhưng tồn khả dụng chỉ còn %s %s.",
                                ingName, needed.stripTrailingZeros().toPlainString(), unit,
                                available.stripTrailingZeros().toPlainString(), unit));
                    }
                }
            }

            MenuSuggestionDto suggestion = new MenuSuggestionDto();
            suggestion.setName(raw.name() != null && !raw.name().isBlank() ? raw.name().trim() : "Thực đơn yến tiệc gợi ý");
            suggestion.setReason(raw.reason() != null && !raw.reason().isBlank() ? raw.reason().trim() : "Phù hợp với tiêu chuẩn tiệc và khẩu vị bàn tiệc.");
            suggestion.setItems(itemDtos);
            suggestion.setTotalPerTable(totalPerTable);
            suggestion.setTableCount(tableCount);
            suggestion.setTotalOrderAmount(totalOrderAmount);
            suggestion.setBudgetStatus(budgetStatus);
            suggestion.setAvailabilityStatus(availabilityStatus);
            suggestion.setValidationMessages(validationMessages);

            validatedSuggestions.add(suggestion);
        }

        return validatedSuggestions;
    }
}
