package com.banquethub.modules.ai.service;

import com.banquethub.modules.ai.dto.DishCandidateDto;
import com.banquethub.modules.catalog.entity.Dish;
import com.banquethub.modules.catalog.entity.DishStatus;
import com.banquethub.modules.catalog.entity.RecipeItem;
import com.banquethub.modules.catalog.repository.DishRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Service
public class MenuCandidateService {

    private final DishRepository dishRepository;

    public MenuCandidateService(DishRepository dishRepository) {
        this.dishRepository = dishRepository;
    }

    @Transactional(readOnly = true)
    public List<DishCandidateDto> getEligibleCandidates(String excludedIngredientsStr) {
        List<Dish> activeDishes = dishRepository.findByStatusOrderByCategoryDisplayOrderAscNameAsc(DishStatus.ACTIVE);
        if (activeDishes == null || activeDishes.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> excludedKeywords = parseExcludedKeywords(excludedIngredientsStr);

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

            // Check if all ingredients have positive stock
            boolean hasFullPhysicalStock = dish.getRecipeItems().stream()
                    .allMatch(r -> r.getIngredient() != null
                            && r.getIngredient().getCurrentStock() != null
                            && r.getIngredient().getCurrentStock().compareTo(BigDecimal.ZERO) > 0);

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

            if (hasFullPhysicalStock) {
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

    public static List<String> parseExcludedKeywords(String input) {
        if (input == null || input.isBlank()) {
            return Collections.emptyList();
        }

        String normalized = input.toLowerCase(Locale.ROOT)
                .replaceAll("(?i)\\b(không\\s*ăn|không\\s*thích|không\\s*lấy|không|tránh|dị\\s*ứng|kiêng)\\b", " ")
                .trim();

        // Split by comma, semicolon, newline, and Vietnamese conjunctions 'và', 'hoặc', 'với'
        String[] rawTokens = normalized.split("[,;\\n]+|\\s+(?:và|hoặc|với)\\s+");

        return Arrays.stream(rawTokens)
                .map(String::trim)
                .filter(s -> s.length() >= 2)
                .distinct()
                .toList();
    }

    public static boolean matchesAnyKeyword(String dishName, List<String> ingredientNames, List<String> keywords) {
        if (keywords == null || keywords.isEmpty()) {
            return false;
        }
        String lowerDishName = dishName != null ? dishName.toLowerCase(Locale.ROOT) : "";
        for (String kw : keywords) {
            String cleanKw = kw.trim().toLowerCase(Locale.ROOT);
            if (cleanKw.length() < 2) continue;

            if (lowerDishName.contains(cleanKw)) {
                return true;
            }
            if (ingredientNames != null) {
                for (String ing : ingredientNames) {
                    if (ing != null && ing.toLowerCase(Locale.ROOT).contains(cleanKw)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
