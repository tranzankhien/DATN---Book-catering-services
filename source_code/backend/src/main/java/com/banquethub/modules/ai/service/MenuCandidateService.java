package com.banquethub.modules.ai.service;

import com.banquethub.modules.ai.dto.DishCandidateDto;
import com.banquethub.modules.catalog.entity.Dish;
import com.banquethub.modules.catalog.entity.DishStatus;
import com.banquethub.modules.catalog.repository.DishRepository;
import com.banquethub.modules.reservations.service.StockReservationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service responsible for selecting up to 50 active dishes with recipes
 * and sufficient available inventory for the required table count,
 * respecting excluded ingredients/allergens (both accented and unaccented).
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
    public List<DishCandidateDto> getEligibleCandidates(String excludedIngredientsStr, Integer tableCount) {
        int requiredTables = tableCount != null && tableCount > 0 ? tableCount : 1;
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

            // Check if dish contains excluded ingredients (both accented and unaccented)
            if (matchesAnyKeyword(dish.getName(), ingredientNames, excludedKeywords)) {
                continue;
            }

            // Check if all ingredients have enough available stock for all tables of the banquet
            boolean hasFullAvailableStock = dish.getRecipeItems().stream()
                    .allMatch(r -> {
                        if (r.getIngredient() == null || r.getQuantity() == null) return false;
                        Long ingId = r.getIngredient().getId();
                        BigDecimal avail = availableStockMap.getOrDefault(ingId, r.getIngredient().getCurrentStock());
                        BigDecimal neededForBanquet = r.getQuantity().multiply(BigDecimal.valueOf(requiredTables));
                        return avail != null && avail.compareTo(neededForBanquet) >= 0;
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

        // Prioritize candidates with sufficient stock for the entire banquet first, then fill up to 50
        List<DishCandidateDto> result = new ArrayList<>(fullyStockedCandidates);
        for (DishCandidateDto other : otherCandidates) {
            if (result.size() >= 50) break;
            result.add(other);
        }

        return result.size() > 50 ? result.subList(0, 50) : result;
    }

    @Transactional(readOnly = true)
    public List<DishCandidateDto> getEligibleCandidates(String excludedIngredientsStr) {
        return getEligibleCandidates(excludedIngredientsStr, 1);
    }

    public static List<String> parseExcludedKeywords(String excludedIngredientsStr) {
        if (excludedIngredientsStr == null || excludedIngredientsStr.isBlank()) {
            return Collections.emptyList();
        }

        return Arrays.stream(excludedIngredientsStr.split("[,;\\n]+|\\s+(?:và|va|hoặc|hoac|với|voi)\\s+"))
                .map(String::trim)
                .map(s -> s.replaceAll("(?i)^(?:(?:không|khong)\\s*(?:ăn|an|lấy|lay|thích|thich|dùng|dung)?|(?:dị\\s*ứng|di\\s*ung)(?:\\s*(?:với|voi))?|(?:kiêng|kieng)|(?:tránh|tranh))\\s*", ""))
                .map(String::trim)
                .filter(s -> !s.isEmpty() && s.length() >= 2)
                .filter(s -> !s.matches("(?i)^(không|khong|ăn|an|lấy|lay|thích|thich|tránh|tranh|dị ứng|di ung|kiêng|kieng)$"))
                .map(String::toLowerCase)
                .distinct()
                .toList();
    }

    public static List<String> extractExclusionPhrasesFromText(String text) {
        if (text == null || text.isBlank()) return Collections.emptyList();
        Pattern p = Pattern.compile("(?i)(?:(?:không|khong)\\s*(?:ăn|an|lấy|lay|thích|thich|dùng|dung)?|(?:dị\\s*ứng|di\\s*ung)(?:\\s*(?:với|voi))?|(?:kiêng|kieng)|(?:tránh|tranh))\\s+([^.!?\\n;]+)");
        Matcher m = p.matcher(text);
        List<String> results = new ArrayList<>();
        while (m.find()) {
            String phrase = m.group(1).trim();
            String[] parts = phrase.split("(?i)\\b(?:thích|thich|ưu tiên|uu tien|muốn|muon|ngân sách|ngan sach|chi phí|chi phi|tài chính|tai chinh)\\b");
            if (parts.length > 0 && !parts[0].isBlank()) {
                results.addAll(parseExcludedKeywords(parts[0]));
            }
        }
        return results.stream().distinct().toList();
    }

    public static boolean matchesAnyKeyword(String dishName, List<String> ingredientNames, List<String> keywords) {
        if (keywords == null || keywords.isEmpty()) return false;

        String lowerDish = dishName != null ? dishName.toLowerCase() : "";
        String unaccentedDish = removeDiacritics(lowerDish);

        List<String> lowerIngs = ingredientNames != null
                ? ingredientNames.stream().map(String::toLowerCase).toList()
                : Collections.emptyList();
        List<String> unaccentedIngs = lowerIngs.stream().map(MenuCandidateService::removeDiacritics).toList();

        for (String kw : keywords) {
            if (kw.isEmpty()) continue;
            String lowerKw = kw.toLowerCase();
            String unaccentedKw = removeDiacritics(lowerKw);

            if (lowerDish.contains(lowerKw) || unaccentedDish.contains(unaccentedKw)) {
                return true;
            }
            for (int i = 0; i < lowerIngs.size(); i++) {
                if (lowerIngs.get(i).contains(lowerKw) || unaccentedIngs.get(i).contains(unaccentedKw)) {
                    return true;
                }
            }
        }
        return false;
    }

    public static String removeDiacritics(String str) {
        if (str == null) return "";
        String nfd = Normalizer.normalize(str, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(nfd).replaceAll("").replace('đ', 'd').replace('Đ', 'D').toLowerCase();
    }
}
