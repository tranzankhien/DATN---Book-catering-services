package com.banquethub.modules.ai.service;

import com.banquethub.modules.ai.dto.DishCandidateDto;
import com.banquethub.modules.catalog.entity.Dish;
import com.banquethub.modules.catalog.entity.DishStatus;
import com.banquethub.modules.catalog.entity.RecipeItem;
import com.banquethub.modules.catalog.repository.DishRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        List<DishCandidateDto> candidates = new ArrayList<>();
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
            candidates.add(dto);

            if (candidates.size() >= 50) {
                break;
            }
        }

        return candidates;
    }

    private List<String> parseExcludedKeywords(String input) {
        if (input == null || input.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(input.toLowerCase(Locale.ROOT).split("[,;\\n]+"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private boolean matchesAnyKeyword(String dishName, List<String> ingredientNames, List<String> keywords) {
        if (keywords.isEmpty()) {
            return false;
        }
        String lowerDishName = dishName.toLowerCase(Locale.ROOT);
        for (String kw : keywords) {
            // strip prefix "không ", "tránh ", "dị ứng "
            String cleanKw = kw.replace("không ", "").replace("tránh ", "").replace("dị ứng ", "").trim();
            if (cleanKw.length() < 2) continue;

            if (lowerDishName.contains(cleanKw)) {
                return true;
            }
            for (String ing : ingredientNames) {
                if (ing.toLowerCase(Locale.ROOT).contains(cleanKw)) {
                    return true;
                }
            }
        }
        return false;
    }
}
