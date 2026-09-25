package com.banquethub.modules.catalog.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.DuplicateResourceException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.catalog.dto.CategoryRequest;
import com.banquethub.modules.catalog.dto.CategoryResponse;
import com.banquethub.modules.catalog.dto.DishDetailResponse;
import com.banquethub.modules.catalog.dto.DishRecipeUpdateRequest;
import com.banquethub.modules.catalog.dto.DishSummaryResponse;
import com.banquethub.modules.catalog.dto.DishUpsertRequest;
import com.banquethub.modules.catalog.dto.IngredientRequest;
import com.banquethub.modules.catalog.dto.IngredientResponse;
import com.banquethub.modules.catalog.dto.RecipeItemRequest;
import com.banquethub.modules.catalog.entity.Dish;
import com.banquethub.modules.catalog.entity.DishCategory;
import com.banquethub.modules.catalog.entity.DishStatus;
import com.banquethub.modules.catalog.entity.Ingredient;
import com.banquethub.modules.catalog.entity.RecipeItem;
import com.banquethub.modules.catalog.repository.DishCategoryRepository;
import com.banquethub.modules.catalog.repository.DishRepository;
import com.banquethub.modules.catalog.repository.IngredientRepository;
import com.banquethub.modules.catalog.repository.RecipeItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CatalogService {

    private final DishCategoryRepository categoryRepository;
    private final IngredientRepository ingredientRepository;
    private final DishRepository dishRepository;
    private final RecipeItemRepository recipeItemRepository;

    public CatalogService(
            DishCategoryRepository categoryRepository,
            IngredientRepository ingredientRepository,
            DishRepository dishRepository,
            RecipeItemRepository recipeItemRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.ingredientRepository = ingredientRepository;
        this.dishRepository = dishRepository;
        this.recipeItemRepository = recipeItemRepository;
    }

    // =====================================================================
    // PUBLIC CATALOG API (Guest / User)
    // =====================================================================

    @Transactional(readOnly = true)
    public List<CategoryResponse> getPublicCategories() {
        return categoryRepository.findByActiveTrueOrderByDisplayOrderAscNameAsc()
                .stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DishSummaryResponse> getPublicDishes(Long categoryId, String keyword) {
        List<Dish> activeDishes = dishRepository.findByStatusOrderByCategoryDisplayOrderAscNameAsc(DishStatus.ACTIVE);
        return activeDishes.stream()
                .filter(dish -> dish.getCategory().isActive())
                .filter(dish -> categoryId == null || dish.getCategory().getId().equals(categoryId))
                .filter(dish -> matchesKeyword(dish, keyword))
                .map(DishSummaryResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public DishDetailResponse getPublicDishDetail(Long id) {
        Dish dish = dishRepository.findWithDetailsByIdAndStatus(id, DishStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn hoặc món ăn đã ngừng phục vụ"));
        return DishDetailResponse.fromEntity(dish);
    }

    // =====================================================================
    // ADMIN CATALOG API - CATEGORIES & INGREDIENTS
    // =====================================================================

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAdminCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAscNameAsc()
                .stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase(Locale.ROOT);
        if (categoryRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new DuplicateResourceException("Mã danh mục '" + normalizedCode + "' đã tồn tại");
        }
        DishCategory category = new DishCategory();
        category.setCode(normalizedCode);
        category.setName(request.getName().trim());
        category.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        category.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);
        category.setActive(request.getActive() == null || request.getActive());
        return CategoryResponse.fromEntity(categoryRepository.save(category));
    }

    @Transactional(readOnly = true)
    public List<IngredientResponse> getAdminIngredients() {
        Set<Long> usedIngredientIds = recipeItemRepository.findAllUsedIngredientIds();
        return ingredientRepository.findAllByOrderByNameAsc()
                .stream()
                .map(ing -> IngredientResponse.fromEntity(ing, usedIngredientIds.contains(ing.getId())))
                .toList();
    }

    @Transactional
    public IngredientResponse createIngredient(IngredientRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase(Locale.ROOT);
        if (ingredientRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new DuplicateResourceException("Mã nguyên liệu '" + normalizedCode + "' đã tồn tại");
        }
        if (request.getMinStockThreshold() == null || request.getMinStockThreshold().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException("Ngưỡng tồn tối thiểu phải lớn hơn hoặc bằng 0");
        }

        Ingredient ingredient = new Ingredient();
        ingredient.setCode(normalizedCode);
        ingredient.setName(request.getName().trim());
        ingredient.setUnit(request.getUnit().trim());
        ingredient.setMinStockThreshold(request.getMinStockThreshold().setScale(3, RoundingMode.HALF_UP));
        ingredient.setCurrentStock(BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP));
        ingredient.setAvgUnitCost(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        ingredient.setActive(request.getActive() == null || request.getActive());

        return IngredientResponse.fromEntity(ingredientRepository.save(ingredient), false);
    }

    @Transactional
    public IngredientResponse updateIngredient(Long id, IngredientRequest request) {
        Ingredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nguyên liệu với ID: " + id));

        String normalizedCode = request.getCode().trim().toUpperCase(Locale.ROOT);
        ingredientRepository.findByCodeIgnoreCase(normalizedCode)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new DuplicateResourceException("Mã nguyên liệu '" + normalizedCode + "' đã tồn tại");
                });

        if (request.getMinStockThreshold() == null || request.getMinStockThreshold().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException("Ngưỡng tồn tối thiểu phải lớn hơn hoặc bằng 0");
        }

        String newUnit = request.getUnit().trim();
        boolean usedInRecipe = recipeItemRepository.existsByIngredientId(id);
        if (usedInRecipe && !ingredient.getUnit().trim().equals(newUnit)) {
            throw new BusinessValidationException(
                    "Không thể thay đổi đơn vị gốc của nguyên liệu đã được sử dụng trong công thức món ăn"
            );
        }

        ingredient.setCode(normalizedCode);
        ingredient.setName(request.getName().trim());
        ingredient.setUnit(newUnit);
        ingredient.setMinStockThreshold(request.getMinStockThreshold().setScale(3, RoundingMode.HALF_UP));
        if (request.getActive() != null) {
            ingredient.setActive(request.getActive());
        }

        return IngredientResponse.fromEntity(ingredientRepository.save(ingredient), usedInRecipe);
    }

    // =====================================================================
    // ADMIN CATALOG API - DISHES & RECIPES
    // =====================================================================

    @Transactional(readOnly = true)
    public List<DishDetailResponse> getAdminDishes(Long categoryId, DishStatus status, String keyword) {
        return dishRepository.findAllByOrderByCategoryDisplayOrderAscNameAsc()
                .stream()
                .filter(dish -> categoryId == null || dish.getCategory().getId().equals(categoryId))
                .filter(dish -> status == null || dish.getStatus() == status)
                .filter(dish -> matchesKeyword(dish, keyword))
                .map(DishDetailResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public DishDetailResponse getAdminDishDetail(Long id) {
        Dish dish = dishRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + id));
        return DishDetailResponse.fromEntity(dish);
    }

    @Transactional
    public DishDetailResponse createDish(DishUpsertRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase(Locale.ROOT);
        if (dishRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new DuplicateResourceException("Mã món ăn '" + normalizedCode + "' đã tồn tại");
        }
        validatePrice(request.getPrice());

        if (request.getRecipeItems() == null || request.getRecipeItems().isEmpty()) {
            throw new BusinessValidationException("Công thức món ăn phải có ít nhất 01 nguyên liệu hợp lệ");
        }

        DishCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục món với ID: " + request.getCategoryId()));

        Dish dish = new Dish();
        dish.setCode(normalizedCode);
        dish.setName(request.getName().trim());
        dish.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        dish.setImageUrl(StringUtils.hasText(request.getImageUrl()) ? request.getImageUrl().trim() : null);
        dish.setPrice(normalizeVndPrice(request.getPrice()));
        dish.setCategory(category);
        dish.setStatus(request.getStatus() != null ? request.getStatus() : DishStatus.ACTIVE);

        syncRecipeItems(dish, request.getRecipeItems());
        ensureDishHasValidRecipe(dish);

        Dish saved = dishRepository.save(dish);
        return DishDetailResponse.fromEntity(saved);
    }

    @Transactional
    public DishDetailResponse updateDish(Long id, DishUpsertRequest request) {
        Dish dish = dishRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + id));

        String normalizedCode = request.getCode().trim().toUpperCase(Locale.ROOT);
        if (dishRepository.existsByCodeIgnoreCaseAndIdNot(normalizedCode, id)) {
            throw new DuplicateResourceException("Mã món ăn '" + normalizedCode + "' đã được sử dụng cho món khác");
        }
        validatePrice(request.getPrice());

        DishCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục món với ID: " + request.getCategoryId()));

        dish.setCode(normalizedCode);
        dish.setName(request.getName().trim());
        dish.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        dish.setImageUrl(StringUtils.hasText(request.getImageUrl()) ? request.getImageUrl().trim() : null);
        dish.setPrice(normalizeVndPrice(request.getPrice()));
        dish.setCategory(category);
        if (request.getStatus() != null) {
            dish.setStatus(request.getStatus());
        }

        if (request.getRecipeItems() != null) {
            if (request.getRecipeItems().isEmpty()) {
                throw new BusinessValidationException("Công thức món ăn phải có ít nhất 01 nguyên liệu hợp lệ");
            }
            syncRecipeItems(dish, request.getRecipeItems());
        }

        ensureDishHasValidRecipe(dish);

        Dish saved = dishRepository.save(dish);
        return DishDetailResponse.fromEntity(saved);
    }

    @Transactional
    public DishDetailResponse updateDishStatus(Long id, DishStatus status) {
        Dish dish = dishRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + id));
        if (status == DishStatus.ACTIVE) {
            ensureDishHasValidRecipe(dish);
        }
        dish.setStatus(status);
        Dish saved = dishRepository.save(dish);
        return DishDetailResponse.fromEntity(saved);
    }

    @Transactional
    public DishDetailResponse updateDishRecipe(Long id, DishRecipeUpdateRequest request) {
        Dish dish = dishRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + id));

        if (request.getRecipeItems() == null || request.getRecipeItems().isEmpty()) {
            throw new BusinessValidationException("Công thức món ăn phải có ít nhất 01 nguyên liệu hợp lệ");
        }

        syncRecipeItems(dish, request.getRecipeItems());
        ensureDishHasValidRecipe(dish);
        Dish saved = dishRepository.save(dish);
        return DishDetailResponse.fromEntity(saved);
    }

    // =====================================================================
    // PRIVATE HELPERS
    // =====================================================================

    private void syncRecipeItems(Dish dish, List<RecipeItemRequest> itemRequests) {
        if (itemRequests == null || itemRequests.isEmpty()) {
            throw new BusinessValidationException("Công thức món ăn phải có ít nhất 01 nguyên liệu hợp lệ");
        }
        Set<Long> seenIngredientIds = new HashSet<>();
        for (RecipeItemRequest itemReq : itemRequests) {
            if (itemReq == null) {
                throw new BusinessValidationException("Dòng nguyên liệu trong công thức không được để trống");
            }
            if (itemReq.getIngredientId() == null) {
                throw new BusinessValidationException("Mã nguyên liệu trong công thức không được để trống");
            }
            if (itemReq.getQuantity() == null || itemReq.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessValidationException("Định lượng nguyên liệu cho 01 phần món bắt buộc phải lớn hơn 0");
            }
            if (!seenIngredientIds.add(itemReq.getIngredientId())) {
                throw new BusinessValidationException("Nguyên liệu bị trùng lặp trong cùng một công thức món ăn");
            }
        }

        Map<Long, Ingredient> ingredientMap = ingredientRepository.findAllById(seenIngredientIds)
                .stream()
                .collect(Collectors.toMap(Ingredient::getId, Function.identity()));

        if (ingredientMap.size() != seenIngredientIds.size()) {
            throw new BusinessValidationException("Một hoặc nhiều nguyên liệu trong công thức không tồn tại hoặc không hợp lệ");
        }

        for (Ingredient ing : ingredientMap.values()) {
            if (!ing.isActive()) {
                throw new BusinessValidationException("Nguyên liệu '" + ing.getName() + "' đang ngừng hoạt động, không thể đưa vào công thức");
            }
        }

        Map<Long, RecipeItem> existingByIngredientId = dish.getRecipeItems().stream()
                .collect(Collectors.toMap(r -> r.getIngredient().getId(), Function.identity()));

        dish.getRecipeItems().removeIf(existing -> !seenIngredientIds.contains(existing.getIngredient().getId()));

        for (RecipeItemRequest itemReq : itemRequests) {
            Long ingId = itemReq.getIngredientId();
            BigDecimal normalizedQty = itemReq.getQuantity().setScale(3, RoundingMode.HALF_UP);
            if (normalizedQty.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessValidationException("Định lượng nguyên liệu sau làm tròn phải lớn hơn 0");
            }

            RecipeItem existing = existingByIngredientId.get(ingId);
            if (existing != null) {
                existing.setQuantity(normalizedQty);
                existing.setNote(itemReq.getNote() != null ? itemReq.getNote().trim() : null);
            } else {
                RecipeItem newItem = new RecipeItem();
                newItem.setDish(dish);
                newItem.setIngredient(ingredientMap.get(ingId));
                newItem.setQuantity(normalizedQty);
                newItem.setNote(itemReq.getNote() != null ? itemReq.getNote().trim() : null);
                dish.getRecipeItems().add(newItem);
            }
        }
    }

    private void ensureDishHasValidRecipe(Dish dish) {
        if (dish.getRecipeItems() == null || dish.getRecipeItems().isEmpty()) {
            throw new BusinessValidationException("Món ăn bắt buộc phải có ít nhất 01 nguyên liệu hợp lệ trong công thức");
        }
        for (RecipeItem item : dish.getRecipeItems()) {
            if (item == null || item.getIngredient() == null || item.getQuantity() == null
                    || item.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessValidationException("Công thức món ăn chứa nguyên liệu hoặc định lượng không hợp lệ");
            }
        }
    }

    private void validatePrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.valueOf(1000)) < 0) {
            throw new BusinessValidationException("Giá bán một phần món phải từ 1.000 VND trở lên");
        }
    }

    private BigDecimal normalizeVndPrice(BigDecimal price) {
        return price.setScale(0, RoundingMode.HALF_UP).setScale(2, RoundingMode.UNNECESSARY);
    }

    private boolean matchesKeyword(Dish dish, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }
        String q = keyword.trim().toLowerCase(Locale.ROOT);
        boolean nameMatch = dish.getName() != null && dish.getName().toLowerCase(Locale.ROOT).contains(q);
        boolean codeMatch = dish.getCode() != null && dish.getCode().toLowerCase(Locale.ROOT).contains(q);
        boolean descMatch = dish.getDescription() != null && dish.getDescription().toLowerCase(Locale.ROOT).contains(q);
        return nameMatch || codeMatch || descMatch;
    }
}
