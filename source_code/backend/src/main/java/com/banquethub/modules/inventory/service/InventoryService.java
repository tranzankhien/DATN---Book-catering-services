package com.banquethub.modules.inventory.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.catalog.dto.IngredientResponse;
import com.banquethub.modules.catalog.entity.Ingredient;
import com.banquethub.modules.catalog.entity.RecipeItem;
import com.banquethub.modules.catalog.repository.IngredientRepository;
import com.banquethub.modules.catalog.repository.RecipeItemRepository;
import com.banquethub.modules.inventory.dto.IngredientStockDetailResponse;
import com.banquethub.modules.inventory.dto.InventorySummaryResponse;
import com.banquethub.modules.inventory.dto.StockAdjustmentRequest;
import com.banquethub.modules.inventory.dto.StockAdjustmentResponse;
import com.banquethub.modules.inventory.dto.StockMovementResponse;
import com.banquethub.modules.inventory.dto.StockReceiptResponse;
import com.banquethub.modules.inventory.entity.MovementType;
import com.banquethub.modules.inventory.entity.ReferenceType;
import com.banquethub.modules.inventory.entity.StockAdjustment;
import com.banquethub.modules.inventory.entity.StockMovement;
import com.banquethub.modules.inventory.entity.StockReceipt;
import com.banquethub.modules.inventory.repository.StockAdjustmentRepository;
import com.banquethub.modules.inventory.repository.StockMovementRepository;
import com.banquethub.modules.inventory.repository.StockReceiptItemRepository;
import com.banquethub.modules.inventory.repository.StockReceiptRepository;
import com.banquethub.modules.users.entity.User;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class InventoryService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final IngredientRepository ingredientRepository;
    private final RecipeItemRepository recipeItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final StockReceiptRepository stockReceiptRepository;
    private final StockReceiptItemRepository stockReceiptItemRepository;

    public InventoryService(
            IngredientRepository ingredientRepository,
            RecipeItemRepository recipeItemRepository,
            StockMovementRepository stockMovementRepository,
            StockAdjustmentRepository stockAdjustmentRepository,
            StockReceiptRepository stockReceiptRepository,
            StockReceiptItemRepository stockReceiptItemRepository
    ) {
        this.ingredientRepository = ingredientRepository;
        this.recipeItemRepository = recipeItemRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.stockAdjustmentRepository = stockAdjustmentRepository;
        this.stockReceiptRepository = stockReceiptRepository;
        this.stockReceiptItemRepository = stockReceiptItemRepository;
    }

    @Transactional(readOnly = true)
    public List<IngredientResponse> searchIngredients(String keyword, Boolean active, boolean lowStockOnly) {
        Set<Long> usedIds = recipeItemRepository.findAllUsedIngredientIds();
        List<Ingredient> list = ingredientRepository.findAllByOrderByNameAsc();
        if (lowStockOnly) {
            list = list.stream()
                    .filter(i -> i.getCurrentStock().compareTo(i.getMinStockThreshold()) <= 0)
                    .toList();
        }
        if (active != null) {
            list = list.stream()
                    .filter(i -> i.isActive() == active)
                    .toList();
        }
        if (StringUtils.hasText(keyword)) {
            String kw = keyword.trim().toLowerCase();
            list = list.stream()
                    .filter(i -> i.getName().toLowerCase().contains(kw) || i.getCode().toLowerCase().contains(kw))
                    .toList();
        }
        return list.stream()
                .map(i -> IngredientResponse.fromEntity(i, usedIds.contains(i.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IngredientResponse> getLowStockIngredients() {
        Set<Long> usedIds = recipeItemRepository.findAllUsedIngredientIds();
        return ingredientRepository.findLowStockIngredients().stream()
                .map(i -> IngredientResponse.fromEntity(i, usedIds.contains(i.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public IngredientStockDetailResponse getIngredientDetail(Long id) {
        Ingredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nguyên liệu với ID: " + id));

        boolean usedInRecipe = recipeItemRepository.existsByIngredientId(id);
        boolean hasMovements = stockMovementRepository.existsByIngredientId(id);
        boolean hasReceiptItems = stockReceiptItemRepository.existsByIngredientId(id);

        boolean canDelete = !usedInRecipe && !hasMovements && !hasReceiptItems;
        String blockReason = null;
        if (!canDelete) {
            List<String> reasons = new ArrayList<>();
            if (usedInRecipe) reasons.add("đang được sử dụng trong công thức món ăn");
            if (hasMovements || hasReceiptItems) reasons.add("đã phát sinh giao dịch nhập/xuất/điều chỉnh kho");
            blockReason = "Không thể xóa vĩnh viễn do nguyên liệu " + String.join(" và ", reasons) + ". Hãy chọn ẩn (Inactive) nếu không còn sử dụng.";
        }

        IngredientStockDetailResponse resp = new IngredientStockDetailResponse();
        resp.setIngredient(IngredientResponse.fromEntity(ingredient, usedInRecipe));
        resp.setCanDelete(canDelete);
        resp.setDeleteBlockReason(blockReason);

        // Danh sách các món đang dùng nguyên liệu này
        List<RecipeItem> recipeItems = recipeItemRepository.findAll().stream()
                .filter(r -> r.getIngredient().getId().equals(id))
                .toList();

        List<IngredientStockDetailResponse.UsedInDishSummary> dishSummaries = recipeItems.stream().map(r -> {
            String qtyStr = r.getQuantity().stripTrailingZeros().toPlainString() + " " + ingredient.getUnit();
            return new IngredientStockDetailResponse.UsedInDishSummary(
                    r.getDish().getId(),
                    r.getDish().getCode(),
                    r.getDish().getName(),
                    r.getDish().getStatus().name(),
                    qtyStr
            );
        }).toList();
        resp.setUsedInDishes(dishSummaries);

        // 10 biến động gần nhất của nguyên liệu này
        List<StockMovement> movements = stockMovementRepository.findTopByIngredientId(id, PageRequest.of(0, 10));
        resp.setRecentMovements(movements.stream().map(StockMovementResponse::fromEntity).toList());

        return resp;
    }

    @Transactional
    public void deleteIngredient(Long id) {
        Ingredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nguyên liệu với ID: " + id));

        if (recipeItemRepository.existsByIngredientId(id)) {
            throw new BusinessValidationException("Không thể xóa vĩnh viễn nguyên liệu đang được sử dụng trong công thức món ăn. Vui lòng chuyển sang trạng thái Tạm ẩn.");
        }
        if (stockMovementRepository.existsByIngredientId(id) || stockReceiptItemRepository.existsByIngredientId(id)) {
            throw new BusinessValidationException("Không thể xóa vĩnh viễn nguyên liệu đã có lịch sử biến động hoặc chứng từ nhập kho. Vui lòng chuyển sang trạng thái Tạm ẩn.");
        }

        ingredientRepository.delete(ingredient);
    }

    @Transactional
    public StockAdjustmentResponse adjustStock(StockAdjustmentRequest request, User currentUser) {
        if (request.getQuantityChange() == null || request.getQuantityChange().compareTo(BigDecimal.ZERO) == 0) {
            throw new BusinessValidationException("Số lượng điều chỉnh kho phải khác 0");
        }
        if (!StringUtils.hasText(request.getReason())) {
            throw new BusinessValidationException("Lý do điều chỉnh tồn kho bắt buộc phải nhập");
        }

        Ingredient ingredient = ingredientRepository.findById(request.getIngredientId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nguyên liệu với ID: " + request.getIngredientId()));

        BigDecimal currentStock = ingredient.getCurrentStock();
        BigDecimal change = request.getQuantityChange().setScale(3, RoundingMode.HALF_UP);
        BigDecimal newStock = currentStock.add(change).setScale(3, RoundingMode.HALF_UP);

        if (newStock.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException(String.format(
                    "Không thể điều chỉnh làm tồn kho âm! Tồn hiện tại: %s %s, Lượng điều chỉnh: %s %s, Dự kiến sau điều chỉnh: %s %s",
                    currentStock.stripTrailingZeros().toPlainString(), ingredient.getUnit(),
                    change.stripTrailingZeros().toPlainString(), ingredient.getUnit(),
                    newStock.stripTrailingZeros().toPlainString(), ingredient.getUnit()
            ));
        }

        String adjCode = String.format("DC-%06d", stockAdjustmentRepository.getNextAdjustmentCodeSeq());

        StockAdjustment adjustment = new StockAdjustment();
        adjustment.setCode(adjCode);
        adjustment.setIngredient(ingredient);
        adjustment.setQuantityChange(change);
        adjustment.setReason(request.getReason().trim());
        if (currentUser != null) {
            adjustment.setCreatedBy(currentUser);
            adjustment.setCreatedByName(currentUser.getFullName());
        } else {
            adjustment.setCreatedByName("ADMIN");
        }
        StockAdjustment savedAdjustment = stockAdjustmentRepository.save(adjustment);

        // Ghi StockMovement
        StockMovement movement = new StockMovement();
        movement.setIngredient(ingredient);
        movement.setMovementType(MovementType.ADJUSTMENT);
        movement.setQuantityChange(change);
        movement.setStockBefore(currentStock);
        movement.setStockAfter(newStock);
        movement.setUnitCost(ingredient.getAvgUnitCost());
        movement.setAvgCostBefore(ingredient.getAvgUnitCost());
        movement.setAvgCostAfter(ingredient.getAvgUnitCost());
        movement.setReferenceType(ReferenceType.STOCK_ADJUSTMENT);
        movement.setReferenceId(savedAdjustment.getId());
        movement.setReferenceCode(savedAdjustment.getCode());
        movement.setNote(request.getReason().trim());
        if (currentUser != null) {
            movement.setPerformedBy(currentUser);
            movement.setPerformedByName(currentUser.getFullName());
        } else {
            movement.setPerformedByName("ADMIN");
        }
        stockMovementRepository.save(movement);

        // Cập nhật tồn kho nguyên liệu
        ingredient.setCurrentStock(newStock);
        ingredientRepository.save(ingredient);

        return StockAdjustmentResponse.fromEntity(savedAdjustment);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<StockMovementResponse> searchMovementsPaged(
            Long ingredientId,
            MovementType movementType,
            OffsetDateTime fromTime,
            OffsetDateTime toTime,
            int page,
            int size
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                safePage,
                safeSize,
                org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.DESC, "createdAt", "id"
                )
        );

        org.springframework.data.jpa.domain.Specification<StockMovement> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            if (ingredientId != null) {
                predicates.add(cb.equal(root.get("ingredient").get("id"), ingredientId));
            }
            if (movementType != null) {
                predicates.add(cb.equal(root.get("movementType"), movementType));
            }
            if (fromTime != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromTime));
            }
            if (toTime != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toTime));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        org.springframework.data.domain.Page<StockMovement> pageResult = stockMovementRepository.findAll(spec, pageable);
        return pageResult.map(StockMovementResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<StockMovementResponse> searchMovements(
            Long ingredientId,
            MovementType movementType,
            OffsetDateTime fromTime,
            OffsetDateTime toTime,
            int limit
    ) {
        int safeLimit = Math.min(Math.max(limit, 1), 200);
        return searchMovementsPaged(ingredientId, movementType, fromTime, toTime, 0, safeLimit).getContent();
    }

    @Transactional(readOnly = true)
    public InventorySummaryResponse getInventorySummary() {
        InventorySummaryResponse resp = new InventorySummaryResponse();

        List<Ingredient> allIngredients = ingredientRepository.findAll();
        resp.setTotalIngredients(allIngredients.size());

        List<Ingredient> lowStockList = allIngredients.stream()
                .filter(i -> i.isActive() && i.getCurrentStock().compareTo(i.getMinStockThreshold()) <= 0)
                .toList();
        resp.setLowStockCount(lowStockList.size());

        Set<Long> usedIds = recipeItemRepository.findAllUsedIngredientIds();
        resp.setLowStockIngredients(lowStockList.stream()
                .map(i -> IngredientResponse.fromEntity(i, usedIds.contains(i.getId())))
                .toList());

        // Giá trị tồn kho ước tính = SUM(currentStock * avgUnitCost)
        BigDecimal stockValue = allIngredients.stream()
                .map(i -> i.getCurrentStock().multiply(i.getAvgUnitCost()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        resp.setEstimatedStockValue(stockValue);

        // Tổng tiền nhập hàng trong tháng hiện tại
        YearMonth currentYm = YearMonth.now(VN_ZONE);
        LocalDate startOfMonth = currentYm.atDay(1);
        LocalDate endOfMonth = currentYm.atEndOfMonth();
        BigDecimal monthlyPurchased = stockReceiptRepository.sumConfirmedTotalBetweenDates(startOfMonth, endOfMonth);
        resp.setMonthlyPurchasedAmount(monthlyPurchased != null ? monthlyPurchased : BigDecimal.ZERO);

        // Tổng tiền nhập hàng toàn kỳ & thanh toán
        BigDecimal totalPurchased = stockReceiptRepository.sumAllConfirmedTotal();
        BigDecimal totalPaid = stockReceiptRepository.sumAllConfirmedPaid();
        resp.setTotalPurchasedAmount(totalPurchased != null ? totalPurchased : BigDecimal.ZERO);
        resp.setTotalPaidToSuppliers(totalPaid != null ? totalPaid : BigDecimal.ZERO);
        resp.setTotalRemainingToSuppliers(
                resp.getTotalPurchasedAmount().subtract(resp.getTotalPaidToSuppliers()).max(BigDecimal.ZERO)
        );

        // 5 phiếu nhập gần nhất
        List<StockReceipt> recentReceipts = stockReceiptRepository.findAll(
                PageRequest.of(0, 5, org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.DESC, "receiptDate", "id"
                ))
        ).getContent();
        resp.setRecentReceipts(recentReceipts.stream().map(r -> StockReceiptResponse.fromEntity(r, false)).toList());

        // 10 biến động gần nhất
        List<StockMovement> recentMovements = stockMovementRepository.findAll(
                PageRequest.of(0, 10, org.springframework.data.domain.Sort.by(
                        org.springframework.data.domain.Sort.Direction.DESC, "createdAt", "id"
                ))
        ).getContent();
        resp.setRecentMovements(recentMovements.stream().map(StockMovementResponse::fromEntity).toList());

        return resp;
    }
}
