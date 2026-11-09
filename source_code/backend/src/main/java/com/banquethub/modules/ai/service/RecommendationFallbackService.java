package com.banquethub.modules.ai.service;

import com.banquethub.modules.ai.dto.AiMenuRecommendationRequest;
import com.banquethub.modules.ai.dto.BudgetType;
import com.banquethub.modules.ai.dto.DishCandidateDto;
import com.banquethub.modules.ai.dto.MenuSuggestionDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Fallback recommendation engine that creates well-structured banquet menus
 * using rule-based culinary heuristics and budget caps when Gemini AI is disabled,
 * offline, unavailable, or produces unfeasible proposals.
 */
@Service
public class RecommendationFallbackService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationFallbackService.class);

    private final RecommendationValidationService validationService;

    public RecommendationFallbackService(RecommendationValidationService validationService) {
        this.validationService = validationService;
    }

    public List<MenuSuggestionDto> generateFallbackSuggestions(
            AiMenuRecommendationRequest request,
            List<DishCandidateDto> candidates
    ) {
        if (candidates == null || candidates.isEmpty()) {
            return Collections.emptyList();
        }

        // Categorize candidate dishes
        List<DishCandidateDto> appetizers = new ArrayList<>();
        List<DishCandidateDto> mains = new ArrayList<>();
        List<DishCandidateDto> soupsHotpots = new ArrayList<>();
        List<DishCandidateDto> desserts = new ArrayList<>();

        for (DishCandidateDto dish : candidates) {
            String cat = dish.getCategory() != null ? dish.getCategory().toLowerCase() : "";
            String name = dish.getName() != null ? dish.getName().toLowerCase() : "";

            if (cat.contains("khai vị") || cat.contains("gỏi") || cat.contains("salad") || name.contains("súp") || name.contains("gỏi")) {
                appetizers.add(dish);
            } else if (cat.contains("tráng miệng") || name.contains("chè") || name.contains("trái cây") || name.contains("bánh")) {
                desserts.add(dish);
            } else if (cat.contains("lẩu") || cat.contains("canh") || name.contains("lẩu") || name.contains("canh")) {
                soupsHotpots.add(dish);
            } else {
                mains.add(dish);
            }
        }

        // Fallbacks if categories are sparse
        if (mains.isEmpty()) mains.addAll(candidates);
        if (appetizers.isEmpty()) appetizers.addAll(mains);
        if (soupsHotpots.isEmpty()) soupsHotpots.addAll(mains);
        if (desserts.isEmpty()) desserts.addAll(candidates);

        // Sort candidates by price ascending
        Comparator<DishCandidateDto> priceAsc = Comparator.comparing(DishCandidateDto::getPrice);
        appetizers.sort(priceAsc);
        mains.sort(priceAsc);
        soupsHotpots.sort(priceAsc);
        desserts.sort(priceAsc);

        // Calculate target budget per table
        BigDecimal budgetCapPerTable = null;
        if (request.getBudgetAmount() != null && request.getBudgetAmount().signum() > 0) {
            if (request.getBudgetType() == BudgetType.TOTAL_ORDER) {
                int tables = request.getTableCount() != null && request.getTableCount() > 0 ? request.getTableCount() : 1;
                budgetCapPerTable = request.getBudgetAmount().divide(BigDecimal.valueOf(tables), 2, RoundingMode.HALF_UP);
            } else {
                budgetCapPerTable = request.getBudgetAmount();
            }
        }

        List<GeminiClientService.RawAiSuggestion> rawSuggestions = new ArrayList<>();

        // Option 1: Tiết kiệm & Tinh gọn (75% budget or lowest tier)
        List<DishCandidateDto> opt1Dishes = pickDishes(appetizers, mains, soupsHotpots, desserts, budgetCapPerTable, 0.75, 5);
        if (!opt1Dishes.isEmpty()) {
            rawSuggestions.add(new GeminiClientService.RawAiSuggestion(
                    "Thực đơn Tiết kiệm & Tối ưu",
                    "Tối ưu ngân sách bàn tiệc, ưu tiên các món truyền thống thanh đạm, hài hòa khẩu vị.",
                    buildRawItems(opt1Dishes)
            ));
        }

        // Option 2: Hài hòa & Phong phú (88% budget or medium tier)
        List<DishCandidateDto> opt2Dishes = pickDishes(appetizers, mains, soupsHotpots, desserts, budgetCapPerTable, 0.88, 6);
        if (!opt2Dishes.isEmpty()) {
            rawSuggestions.add(new GeminiClientService.RawAiSuggestion(
                    "Thực đơn Hài hòa & Phong phú",
                    "Đa dạng nguồn đạm (hải sản, gia cầm, thịt heo/bò), xen kẽ vị thanh và vị đậm, tráng miệng tươi mát.",
                    buildRawItems(opt2Dishes)
            ));
        }

        // Option 3: Thịnh soạn & Đặc sắc (98% budget or high tier)
        List<DishCandidateDto> opt3Dishes = pickDishes(appetizers, mains, soupsHotpots, desserts, budgetCapPerTable, 0.98, 6);
        if (!opt3Dishes.isEmpty()) {
            rawSuggestions.add(new GeminiClientService.RawAiSuggestion(
                    "Thực đơn Thịnh soạn & Đặc sắc",
                    "Nguyên liệu cao cấp, cách chế biến cầu kỳ, thể hiện sự thịnh soạn và chu đáo của chủ tiệc.",
                    buildRawItems(opt3Dishes)
            ));
        }

        // Validate and enrich all fallback proposals with real DB price calculations & inventory stock verification
        Set<Long> candidateIds = candidates.stream().map(DishCandidateDto::getId).collect(Collectors.toSet());
        List<String> excludedKeywords = MenuCandidateService.parseExcludedKeywords(request.getExcludedIngredients());
        List<MenuSuggestionDto> validated = validationService.validateAndEnrichSuggestions(rawSuggestions, request, candidateIds, excludedKeywords);
        for (MenuSuggestionDto s : validated) {
            s.setSource("RULE_BASED");
        }
        return validated;
    }

    private List<GeminiClientService.RawAiItem> buildRawItems(List<DishCandidateDto> chosenDishes) {
        List<GeminiClientService.RawAiItem> items = new ArrayList<>();
        Set<Long> seenIds = new HashSet<>();
        for (DishCandidateDto dish : chosenDishes) {
            if (seenIds.add(dish.getId())) {
                items.add(new GeminiClientService.RawAiItem(dish.getId(), 1));
            }
        }
        return items;
    }

    private List<DishCandidateDto> pickDishes(
            List<DishCandidateDto> appetizers,
            List<DishCandidateDto> mains,
            List<DishCandidateDto> soupsHotpots,
            List<DishCandidateDto> desserts,
            BigDecimal budgetCap,
            double targetRatio,
            int maxItemCount
    ) {
        if (budgetCap == null) {
            return pickDishesByPercentile(appetizers, mains, soupsHotpots, desserts, targetRatio, maxItemCount);
        }

        BigDecimal targetTotal = budgetCap.multiply(BigDecimal.valueOf(targetRatio));
        List<DishCandidateDto> selected = new ArrayList<>();
        Set<Long> pickedIds = new HashSet<>();

        int mainsCount = maxItemCount >= 6 ? 3 : 2;

        BigDecimal targetAppetizer = targetTotal.multiply(BigDecimal.valueOf(0.18));
        BigDecimal targetDessert = targetTotal.multiply(BigDecimal.valueOf(0.12));
        BigDecimal targetSoup = targetTotal.multiply(BigDecimal.valueOf(0.25));
        BigDecimal remainingForMains = targetTotal.subtract(targetAppetizer).subtract(targetDessert).subtract(targetSoup);
        BigDecimal targetMain = remainingForMains.divide(BigDecimal.valueOf(mainsCount), 2, RoundingMode.HALF_UP);

        BigDecimal currentTotal = BigDecimal.ZERO;

        // 1. Appetizer
        DishCandidateDto app = pickBestFit(appetizers, targetAppetizer, budgetCap.subtract(currentTotal), pickedIds);
        if (app != null) {
            selected.add(app);
            pickedIds.add(app.getId());
            currentTotal = currentTotal.add(app.getPrice());
        }

        // 2. Mains
        for (int i = 0; i < mainsCount; i++) {
            BigDecimal remainingCap = budgetCap.subtract(currentTotal);
            DishCandidateDto main = pickBestFit(mains, targetMain, remainingCap, pickedIds);
            if (main != null) {
                selected.add(main);
                pickedIds.add(main.getId());
                currentTotal = currentTotal.add(main.getPrice());
            }
        }

        // 3. Soup/Hotpot
        BigDecimal remainingForSoup = budgetCap.subtract(currentTotal);
        DishCandidateDto soup = pickBestFit(soupsHotpots, targetSoup, remainingForSoup, pickedIds);
        if (soup != null) {
            selected.add(soup);
            pickedIds.add(soup.getId());
            currentTotal = currentTotal.add(soup.getPrice());
        }

        // 4. Dessert
        BigDecimal remainingForDessert = budgetCap.subtract(currentTotal);
        DishCandidateDto des = pickBestFit(desserts, targetDessert, remainingForDessert, pickedIds);
        if (des != null) {
            selected.add(des);
            pickedIds.add(des.getId());
            currentTotal = currentTotal.add(des.getPrice());
        }

        // Fallback fill to at least 4 items if budget allows
        if (selected.size() < 4) {
            for (DishCandidateDto c : appetizers) {
                if (!pickedIds.contains(c.getId()) && currentTotal.add(c.getPrice()).compareTo(budgetCap) <= 0) {
                    selected.add(c);
                    pickedIds.add(c.getId());
                    currentTotal = currentTotal.add(c.getPrice());
                    if (selected.size() >= 4) break;
                }
            }
            for (DishCandidateDto c : mains) {
                if (!pickedIds.contains(c.getId()) && currentTotal.add(c.getPrice()).compareTo(budgetCap) <= 0) {
                    selected.add(c);
                    pickedIds.add(c.getId());
                    currentTotal = currentTotal.add(c.getPrice());
                    if (selected.size() >= 4) break;
                }
            }
        }

        return selected;
    }

    private DishCandidateDto pickBestFit(
            List<DishCandidateDto> list,
            BigDecimal targetPrice,
            BigDecimal maxAllowed,
            Set<Long> pickedIds
    ) {
        if (list == null || list.isEmpty() || maxAllowed.signum() <= 0) return null;

        DishCandidateDto best = null;
        BigDecimal bestDiff = null;

        for (DishCandidateDto dish : list) {
            if (pickedIds.contains(dish.getId())) continue;
            if (dish.getPrice().compareTo(maxAllowed) > 0) continue; // Exceeds budget cap

            BigDecimal diff = dish.getPrice().subtract(targetPrice).abs();
            if (best == null || diff.compareTo(bestDiff) < 0) {
                best = dish;
                bestDiff = diff;
            }
        }

        // If no dish found around target, fallback to cheapest available <= maxAllowed
        if (best == null) {
            for (DishCandidateDto dish : list) {
                if (!pickedIds.contains(dish.getId()) && dish.getPrice().compareTo(maxAllowed) <= 0) {
                    return dish;
                }
            }
        }

        return best;
    }

    private List<DishCandidateDto> pickDishesByPercentile(
            List<DishCandidateDto> appetizers,
            List<DishCandidateDto> mains,
            List<DishCandidateDto> soupsHotpots,
            List<DishCandidateDto> desserts,
            double pricePercentile,
            int targetItemCount
    ) {
        List<DishCandidateDto> result = new ArrayList<>();
        Set<Long> picked = new HashSet<>();

        pickFromList(appetizers, pricePercentile, result, picked);

        int mainsNeeded = targetItemCount >= 6 ? 3 : 2;
        for (int i = 0; i < mainsNeeded; i++) {
            double offset = (i == 0) ? pricePercentile : Math.min(1.0, pricePercentile + 0.15 * i);
            pickFromList(mains, offset, result, picked);
        }

        pickFromList(soupsHotpots, pricePercentile, result, picked);
        pickFromList(desserts, pricePercentile, result, picked);

        return result;
    }

    private void pickFromList(
            List<DishCandidateDto> list,
            double percentile,
            List<DishCandidateDto> result,
            Set<Long> picked
    ) {
        if (list == null || list.isEmpty()) return;

        int index = (int) Math.round(percentile * (list.size() - 1));
        index = Math.max(0, Math.min(list.size() - 1, index));

        for (int offset = 0; offset < list.size(); offset++) {
            int left = index - offset;
            if (left >= 0 && !picked.contains(list.get(left).getId())) {
                DishCandidateDto d = list.get(left);
                picked.add(d.getId());
                result.add(d);
                return;
            }
            int right = index + offset;
            if (right < list.size() && !picked.contains(list.get(right).getId())) {
                DishCandidateDto d = list.get(right);
                picked.add(d.getId());
                result.add(d);
                return;
            }
        }
    }
}
