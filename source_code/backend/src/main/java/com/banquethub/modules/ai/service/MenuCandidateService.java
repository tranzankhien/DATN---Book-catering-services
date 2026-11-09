package com.banquethub.modules.ai.service;

import com.banquethub.modules.ai.dto.DishCandidateDto;
import com.banquethub.modules.catalog.entity.Dish;
import com.banquethub.modules.catalog.entity.DishStatus;
import com.banquethub.modules.catalog.repository.DishRepository;
import com.banquethub.modules.reservations.service.StockReservationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/**
 * Service responsible for selecting up to 50 active dishes with recipes
 * and positive available inventory, respecting excluded ingredients/allergens.
 */
@Service
public class MenuCandidateService {

    private final DishRepository dishRepository;
    private final StockReservationService reservationService;

    public MenuCandidateService(DishRepository dishRepository, StockReservationService reservationService) {
        this.dishRepository = dishRepository;
        this.reservationService = reservationService;
    }

    @Transactional(readOnly = true)
    public List<DishCandidateDto> getEligibleCandidates(String excludedIngredientsStr) {
        List<Dish> activeDishes = dishRepository.findByStatusOrderByCategoryDisplayOrderAscNameAsc(DishStatus.ACTIVE);
        if (activeDishes == null || activeDishes.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> excludedKeywords = parseExcludedKeywords(excludedIngredientsStr);

        // Fetch available stocks for all ingredients across active dishes (physical minus reserved)
        List<Long> allIngredientIds = activeDishes.stream()
                .filter(d -> d.getRecipeItems() != null)
                .flatMap(d -> d.getRecipeItems().stream())
                .filter(r -> r.getIngredient() != null && r.getIngredient().getId() != null)
                .map(r -> r.getIngredient().getId())
                .distinct()
                .toList();

        Map<Long, BigDecimal> availableStockMap = reservationService != null
                ? reservationService.getAvailableStocks(allIngredientIds)
                : Collections.emptyMap();

        List<DishCandidateDto> fullyStockedCandidates = new ArrayList<>();
        List<DishCandidateDto> otherCandidates = new ArrayList<>();

        for (Dish dish : activeDishes) {
            // Must have price and recipe items
            if (dish.getPrice() == null || dish.getPrice().signum() <= 0) {
                continue;
            }
            if (dish.getRecipeItems() == null || dish.getRecipeItems().isEmpty()) {
                continue;
            }

            List<String> ingredientNames = dish.getRecipeItems().stream()
                    .filter(r -> r.getIngredient() != null)
                    .map(r -> r.getIngredient().getName())
                    .toList();

            // Check if dish contains excluded ingredients
            if (matchesAnyKeyword(dish.getName(), ingredientNames, excludedKeywords)) {
                continue;
            }

            // Check if all ingredients have positive available stock (current - reserved)
            boolean hasFullAvailableStock = dish.getRecipeItems().stream()
                    .allMatch(r -> {
                        if (r.getIngredient() == null) return false;
                        Long ingId = r.getIngredient().getId();
                        BigDecimal avail = availableStockMap.getOrDefault(ingId, r.getIngredient().getCurrentStock());
                        return avail != null && avail.compareTo(BigDecimal.ZERO) > 0;
                    });

            DishCandidateDto dto = new DishCandidateDto(
                    dish.getId(),
                    dish.getCode(),
                    dish.getName(),
                    dish.getCategory() != null ? dish.getCategory().getName() : "Món tiệc",
                    dish.getPrice(),
                    dish.getDescription() != null ? dish.getDescription() : "",
                    dish.getImageUrl(),
                    ingredientNames
            );

            if (hasFullAvailableStock) {
                fullyStockedCandidates.add(dto);
            } else {
                otherCandidates.add(dto);
            }
        }

        // Prioritize fully stocked candidates first, then fill up to 50
        List<DishCandidateDto> result = new ArrayList<>(fullyStockedCandidates);
        for (DishCandidateDto other : otherCandidates) {
            if (result.size() >= 50) break;
            result.add(other);
        }

        return result.size() > 50 ? result.subList(0, 50) : result;
    }

    public static List<String> parseExcludedKeywords(String excludedIngredientsStr) {
        if (excludedIngredientsStr == null || excludedIngredientsStr.isBlank()) {
            return Collections.emptyList();
        }

        return Arrays.stream(excludedIngredientsStr.split("[,;\\n]+|\\s+(?:và|hoặc|với)\\s+"))
                .map(String::trim)
                .map(s -> s.replaceAll("(?i)^(?:không\\s*(?:ăn|lấy|thích|dùng)?|dị\\s*ứng(?:\\s*với)?|kiêng|tránh)\\s*", ""))
                .map(String::trim)
                .filter(s -> !s.isEmpty() && s.length() >= 2)
                .filter(s -> !s.matches("(?i)^(không|ăn|lấy|thích|tránh|dị ứng|kiêng)$"))
                .map(String::toLowerCase)
                .distinct()
                .toList();
    }

    public static boolean matchesAnyKeyword(String dishName, List<String> ingredientNames, List<String> keywords) {
        if (keywords == null || keywords.isEmpty()) return false;

        String lowerDish = dishName != null ? dishName.toLowerCase() : "";
        List<String> lowerIngs = ingredientNames != null
                ? ingredientNames.stream().map(String::toLowerCase).toList()
                : Collections.emptyList();

        for (String kw : keywords) {
            if (kw.isEmpty()) continue;
            if (lowerDish.contains(kw)) {
                return true;
            }
            for (String ing : lowerIngs) {
                if (ing.contains(kw)) {
                    return true;
                }
            }
        }
        return false;
    }
}
