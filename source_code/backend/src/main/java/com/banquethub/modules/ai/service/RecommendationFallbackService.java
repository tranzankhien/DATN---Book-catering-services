package com.banquethub.modules.ai.service;

import com.banquethub.modules.ai.dto.AiMenuRecommendationRequest;
import com.banquethub.modules.ai.dto.DishCandidateDto;
import com.banquethub.modules.ai.dto.MenuSuggestionDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Fallback recommendation engine that creates well-structured banquet menus
 * using rule-based culinary heuristics when Gemini AI is disabled, offline, or unavailable.
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

        List<GeminiClientService.RawAiSuggestion> rawSuggestions = new ArrayList<>();

        // Option 1: Tiết kiệm & Tinh gọn
        rawSuggestions.add(new GeminiClientService.RawAiSuggestion(
                "Thực đơn Tiết kiệm & Tối ưu",
                "Tối ưu ngân sách bàn tiệc, ưu tiên các món truyền thống thanh đạm, hài hòa khẩu vị.",
                buildRawItems(pickDishes(appetizers, mains, soupsHotpots, desserts, 0.2, 5))
        ));

        // Option 2: Hài hòa & Đậm đà
        rawSuggestions.add(new GeminiClientService.RawAiSuggestion(
                "Thực đơn Hài hòa & Phong phú",
                "Đa dạng nguồn đạm (hải sản, gia cầm, thịt heo/bò), xen kẽ vị thanh và vị đậm, tráng miệng tươi mát.",
                buildRawItems(pickDishes(appetizers, mains, soupsHotpots, desserts, 0.5, 6))
        ));

        // Option 3: Thịnh soạn & Sang trọng
        rawSuggestions.add(new GeminiClientService.RawAiSuggestion(
                "Thực đơn Thịnh soạn & Đặc sắc",
                "Nguyên liệu cao cấp, cách chế biến cầu kỳ, thể hiện sự thịnh soạn và chu đáo của chủ tiệc.",
                buildRawItems(pickDishes(appetizers, mains, soupsHotpots, desserts, 0.8, 6))
        ));

        // Validate and enrich all fallback proposals with real DB price calculations & inventory stock verification
        List<MenuSuggestionDto> validated = validationService.validateAndEnrichSuggestions(rawSuggestions, request);
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
            double pricePercentile,
            int targetItemCount
    ) {
        List<DishCandidateDto> result = new ArrayList<>();
        Set<Long> picked = new HashSet<>();

        // 1 appetizer
        pickFromList(appetizers, pricePercentile, result, picked);

        // 2-3 mains
        int mainsNeeded = targetItemCount >= 6 ? 3 : 2;
        for (int i = 0; i < mainsNeeded; i++) {
            double offset = (i == 0) ? pricePercentile : Math.min(1.0, pricePercentile + 0.15 * i);
            pickFromList(mains, offset, result, picked);
        }

        // 1 soup/hotpot
        pickFromList(soupsHotpots, pricePercentile, result, picked);

        // 1 dessert
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
