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
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
        return validateAndEnrichSuggestions(rawSuggestions, request, null, null);
    }

    @Transactional(readOnly = true)
    public List<MenuSuggestionDto> validateAndEnrichSuggestions(
            List<GeminiClientService.RawAiSuggestion> rawSuggestions,
            AiMenuRecommendationRequest request,
            Set<Long> eligibleCandidateIds,
            List<String> excludedKeywords
    ) {
        if (rawSuggestions == null || rawSuggestions.isEmpty()) {
            return new ArrayList<>();
        }

        int tableCount = Math.max(1, request.getTableCount());

        // Calculate effective budget
        BigDecimal effectiveBudget = request.getBudgetAmount();
        BudgetType effectiveBudgetType = request.getBudgetType() != null ? request.getBudgetType() : BudgetType.PER_TABLE;

        if (effectiveBudget == null && request.getRequestText() != null) {
            BudgetExtractionResult extracted = extractBudgetFromText(request.getRequestText());
            if (extracted != null) {
                effectiveBudget = extracted.amount();
                if (request.getBudgetType() == null && extracted.budgetType() != null) {
                    effectiveBudgetType = extracted.budgetType();
                }
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

        if (allDishIds.isEmpty()) {
            return new ArrayList<>();
        }

        Map<Long, Dish> dishMap = dishRepository.findAllById(allDishIds).stream()
                .filter(d -> d.getStatus() == DishStatus.ACTIVE && d.getRecipeItems() != null && !d.getRecipeItems().isEmpty())
                .filter(d -> eligibleCandidateIds == null || eligibleCandidateIds.contains(d.getId()))
                .filter(d -> {
                    if (excludedKeywords == null || excludedKeywords.isEmpty()) return true;
                    List<String> ingNames = d.getRecipeItems().stream()
                            .filter(r -> r.getIngredient() != null)
                            .map(r -> r.getIngredient().getName())
                            .toList();
                    return !MenuCandidateService.matchesAnyKeyword(d.getName(), ingNames, excludedKeywords);
                })
                .collect(Collectors.toMap(Dish::getId, Function.identity()));

        List<MenuSuggestionDto> validatedSuggestions = new ArrayList<>();
        Set<Set<Long>> seenDishSignatures = new HashSet<>();

        for (GeminiClientService.RawAiSuggestion raw : rawSuggestions) {
            if (validatedSuggestions.size() >= 3) {
                break; // Max 3 unique suggestions
            }

            if (raw.items() == null || raw.items().isEmpty()) {
                continue;
            }

            // Deduplicate and cap item quantities per table (max 10 portions of any dish per table)
            Map<Long, Integer> itemQuantities = new LinkedHashMap<>();
            for (GeminiClientService.RawAiItem rawItem : raw.items()) {
                if (rawItem.dishId() == null) continue;
                Dish dish = dishMap.get(rawItem.dishId());
                if (dish == null) continue; // Dish not in eligible whitelist or contains allergens

                int qty = rawItem.quantityPerTable() != null && rawItem.quantityPerTable() > 0
                        ? Math.min(rawItem.quantityPerTable(), 10)
                        : 1;

                int currentQty = itemQuantities.getOrDefault(dish.getId(), 0);
                itemQuantities.put(dish.getId(), Math.min(currentQty + qty, 10));
            }

            if (itemQuantities.isEmpty()) {
                continue;
            }

            // Skip suggestions that have identical set of dishes
            Set<Long> signature = itemQuantities.keySet();
            if (seenDishSignatures.contains(signature)) {
                continue;
            }
            seenDishSignatures.add(signature);

            // Calculate prices from database
            BigDecimal totalPerTable = BigDecimal.ZERO;
            List<MenuSuggestionItemDto> itemDtos = new ArrayList<>();
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

            // Budget validation: compare accurately without per-table rounding error on TOTAL_ORDER
            BudgetStatus budgetStatus;
            if (effectiveBudget == null || effectiveBudget.signum() <= 0) {
                budgetStatus = BudgetStatus.NO_BUDGET_SET;
            } else if (effectiveBudgetType == BudgetType.TOTAL_ORDER) {
                budgetStatus = totalOrderAmount.compareTo(effectiveBudget) <= 0
                        ? BudgetStatus.WITHIN_BUDGET
                        : BudgetStatus.OVER_BUDGET;
            } else {
                budgetStatus = totalPerTable.compareTo(effectiveBudget) <= 0
                        ? BudgetStatus.WITHIN_BUDGET
                        : BudgetStatus.OVER_BUDGET;
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

            String safeName = raw.name() != null && !raw.name().isBlank() ? raw.name().trim() : "Thực đơn yến tiệc gợi ý";
            if (safeName.length() > 100) safeName = safeName.substring(0, 97) + "...";

            String safeReason = raw.reason() != null && !raw.reason().isBlank() ? raw.reason().trim() : "Phù hợp với tiêu chuẩn tiệc và khẩu vị bàn tiệc.";
            if (safeReason.length() > 300) safeReason = safeReason.substring(0, 297) + "...";

            MenuSuggestionDto suggestion = new MenuSuggestionDto();
            suggestion.setName(safeName);
            suggestion.setReason(safeReason);
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

    public record BudgetExtractionResult(BigDecimal amount, BudgetType budgetType) {}

    public static BudgetExtractionResult extractBudgetFromText(String text) {
        if (text == null || text.isBlank()) return null;
        try {
            // Priority 1: Shorthand like 1tr5, 2tr8
            Pattern pShorthand = Pattern.compile("(?i)(?:ngân\\s*sách|chi\\s*phí|tầm|khoảng|giá)?\\s*(\\d+)tr(\\d+)(?:\\s*(\\/|mỗi|một)?\\s*(bàn|mâm|tiệc|cả tiệc))?");
            Matcher mShort = pShorthand.matcher(text);
            if (mShort.find()) {
                long whole = Long.parseLong(mShort.group(1));
                String fracStr = mShort.group(2);
                double frac = Double.parseDouble("0." + fracStr);
                BigDecimal amount = BigDecimal.valueOf((long) ((whole + frac) * 1_000_000L));
                BudgetType type = determineBudgetType(text, mShort.start(), mShort.end());
                return new BudgetExtractionResult(amount, type);
            }

            // Priority 2: Standard currency phrase (e.g. 1.5 triệu, 3.000.000đ/bàn, 800k, 50k)
            Pattern p = Pattern.compile(
                    "(?i)(?:ngân\\s*sách|chi\\s*phí|tài\\s*chính|giá(?:\\s*tiền)?)\\s*(?:dự\\s*kiến\\s*)?(?:khoảng|tầm|tầm\\s*khoảng|là)?\\s*([0-9\\.\\,]+)\\s*(triệu|tr|k|nghìn|ngàn|đ|vnd)?(?:\\s*(?:\\/|\\s*mỗi\\s*|\\s*một\\s*|\\s*1\\s*)(bàn|mâm|tiệc|cả tiệc|người))?"
            );
            Matcher m = p.matcher(text);
            if (m.find()) {
                String rawNum = m.group(1).trim();
                String unit = m.group(2) != null ? m.group(2).toLowerCase() : "";

                BigDecimal parsedAmount = null;

                if (unit.contains("triệu") || unit.contains("tr")) {
                    double val = Double.parseDouble(rawNum.replace(',', '.'));
                    parsedAmount = BigDecimal.valueOf((long) (val * 1_000_000L));
                } else if (unit.contains("k") || unit.contains("nghìn") || unit.contains("ngàn")) {
                    double val = Double.parseDouble(rawNum.replace(',', '.'));
                    parsedAmount = BigDecimal.valueOf((long) (val * 1_000L));
                } else {
                    String cleanDigits = rawNum.replace(".", "").replace(",", "");
                    if (!cleanDigits.isEmpty()) {
                        long base = Long.parseLong(cleanDigits);
                        if (base >= 10_000) {
                            parsedAmount = BigDecimal.valueOf(base);
                        }
                    }
                }

                if (parsedAmount != null && parsedAmount.signum() > 0) {
                    BudgetType type = determineBudgetType(text, m.start(), m.end());
                    return new BudgetExtractionResult(parsedAmount, type);
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private static BudgetType determineBudgetType(String fullText, int matchStart, int matchEnd) {
        String matchSnippet = fullText.substring(matchStart, matchEnd).toLowerCase();
        if (matchSnippet.contains("/bàn") || matchSnippet.contains("mỗi bàn") || matchSnippet.contains("1 bàn") || matchSnippet.contains("mâm")) {
            return BudgetType.PER_TABLE;
        }

        int start = Math.max(0, matchStart - 15);
        int end = Math.min(fullText.length(), matchEnd + 25);
        String surrounding = fullText.substring(start, end).toLowerCase();

        if (surrounding.contains("cả tiệc") || surrounding.contains("toàn bộ") || surrounding.contains("trọn gói")) {
            return BudgetType.TOTAL_ORDER;
        }
        if (surrounding.contains("tổng ngân sách") || surrounding.contains("tổng chi phí")) {
            return BudgetType.TOTAL_ORDER;
        }
        return BudgetType.PER_TABLE;
    }
}
