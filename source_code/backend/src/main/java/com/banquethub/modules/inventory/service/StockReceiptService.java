package com.banquethub.modules.inventory.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.catalog.entity.Ingredient;
import com.banquethub.modules.catalog.repository.IngredientRepository;
import com.banquethub.modules.inventory.dto.StockReceiptCreateRequest;
import com.banquethub.modules.inventory.dto.StockReceiptItemRequest;
import com.banquethub.modules.inventory.dto.StockReceiptPaymentRequest;
import com.banquethub.modules.inventory.dto.StockReceiptResponse;
import com.banquethub.modules.inventory.entity.MovementType;
import com.banquethub.modules.inventory.entity.PaymentStatus;
import com.banquethub.modules.inventory.entity.ReferenceType;
import com.banquethub.modules.inventory.entity.StockMovement;
import com.banquethub.modules.inventory.entity.StockReceipt;
import com.banquethub.modules.inventory.entity.StockReceiptItem;
import com.banquethub.modules.inventory.entity.StockReceiptStatus;
import com.banquethub.modules.inventory.repository.StockMovementRepository;
import com.banquethub.modules.inventory.repository.StockReceiptRepository;
import com.banquethub.modules.suppliers.entity.Supplier;
import com.banquethub.modules.suppliers.repository.SupplierRepository;
import com.banquethub.modules.users.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class StockReceiptService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final StockReceiptRepository stockReceiptRepository;
    private final SupplierRepository supplierRepository;
    private final IngredientRepository ingredientRepository;
    private final StockMovementRepository stockMovementRepository;

    public StockReceiptService(
            StockReceiptRepository stockReceiptRepository,
            SupplierRepository supplierRepository,
            IngredientRepository ingredientRepository,
            StockMovementRepository stockMovementRepository
    ) {
        this.stockReceiptRepository = stockReceiptRepository;
        this.supplierRepository = supplierRepository;
        this.ingredientRepository = ingredientRepository;
        this.stockMovementRepository = stockMovementRepository;
    }

    @Transactional(readOnly = true)
    public List<StockReceiptResponse> searchReceipts(
            Long supplierId,
            StockReceiptStatus status,
            PaymentStatus paymentStatus,
            LocalDate fromDate,
            LocalDate toDate,
            String keyword
    ) {
        List<StockReceipt> list = stockReceiptRepository.findWithFilters(
                supplierId,
                status,
                paymentStatus,
                fromDate,
                toDate
        );
        if (StringUtils.hasText(keyword)) {
            String kw = keyword.trim().toLowerCase();
            list = list.stream()
                    .filter(r -> (r.getCode() != null && r.getCode().toLowerCase().contains(kw))
                            || (r.getSupplier() != null && r.getSupplier().getName().toLowerCase().contains(kw)))
                    .toList();
        }
        return list.stream().map(r -> StockReceiptResponse.fromEntity(r, false)).toList();
    }

    @Transactional(readOnly = true)
    public StockReceiptResponse getReceiptById(Long id) {
        StockReceipt receipt = stockReceiptRepository.findWithItemsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập với ID: " + id));
        return StockReceiptResponse.fromEntity(receipt, true);
    }

    @Transactional
    public StockReceiptResponse createReceipt(StockReceiptCreateRequest request, User currentUser) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + request.getSupplierId()));

        if (!supplier.isActive()) {
            throw new BusinessValidationException("Nhà cung cấp '" + supplier.getName() + "' đang tạm ngừng hoạt động, không thể tạo phiếu nhập");
        }

        validateReceiptItems(request.getItems());

        String receiptCode = String.format("PN-%06d", stockReceiptRepository.getNextReceiptCodeSeq());

        StockReceipt receipt = new StockReceipt();
        receipt.setCode(receiptCode);
        receipt.setSupplier(supplier);
        receipt.setReceiptDate(request.getReceiptDate() != null ? request.getReceiptDate() : LocalDate.now(VN_ZONE));
        receipt.setStatus(StockReceiptStatus.DRAFT);
        receipt.setNote(StringUtils.hasText(request.getNote()) ? request.getNote().trim() : null);
        receipt.setPaymentNote(StringUtils.hasText(request.getPaymentNote()) ? request.getPaymentNote().trim() : null);

        if (currentUser != null) {
            receipt.setCreatedBy(currentUser);
            receipt.setCreatedByName(currentUser.getFullName());
        } else {
            receipt.setCreatedByName("ADMIN");
        }

        buildReceiptItems(receipt, request.getItems());

        BigDecimal total = calculateTotalAmount(receipt.getItems());
        receipt.setTotalAmount(total);

        // Theo quy tắc nghiệp vụ SRS BR-11: Phiếu nháp luôn khởi tạo chưa thanh toán (amountPaid = 0, UNPAID).
        // Chỉ ghi nhận thanh toán toàn bộ sau khi phiếu đã được xác nhận nhập kho.
        receipt.setAmountPaid(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        receipt.setPaymentStatus(PaymentStatus.UNPAID);
        receipt.setLastPaidAt(null);

        StockReceipt saved = stockReceiptRepository.save(receipt);

        if (Boolean.TRUE.equals(request.getConfirmImmediately())) {
            return confirmReceiptInternal(saved, currentUser);
        }

        return StockReceiptResponse.fromEntity(saved, true);
    }

    @Transactional
    public StockReceiptResponse updateDraftReceipt(Long id, StockReceiptCreateRequest request, User currentUser) {
        StockReceipt receipt = stockReceiptRepository.findWithItemsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập với ID: " + id));

        if (receipt.getStatus() == StockReceiptStatus.CONFIRMED) {
            throw new BusinessValidationException("Phiếu nhập đã được xác nhận nhập kho, không được phép chỉnh sửa số lượng hoặc đơn giá trực tiếp. Vui lòng sử dụng chức năng điều chỉnh tồn kho.");
        }

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + request.getSupplierId()));

        if (!supplier.isActive()) {
            throw new BusinessValidationException("Nhà cung cấp '" + supplier.getName() + "' đang tạm ngừng hoạt động");
        }

        validateReceiptItems(request.getItems());

        receipt.setSupplier(supplier);
        if (request.getReceiptDate() != null) {
            receipt.setReceiptDate(request.getReceiptDate());
        }
        receipt.setNote(StringUtils.hasText(request.getNote()) ? request.getNote().trim() : null);
        receipt.setPaymentNote(StringUtils.hasText(request.getPaymentNote()) ? request.getPaymentNote().trim() : null);

        receipt.getItems().clear();
        stockReceiptRepository.flush();
        buildReceiptItems(receipt, request.getItems());

        BigDecimal total = calculateTotalAmount(receipt.getItems());
        receipt.setTotalAmount(total);

        // Theo quy tắc nghiệp vụ SRS BR-11: Phiếu nháp không ghi nhận thanh toán
        receipt.setAmountPaid(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        receipt.setPaymentStatus(PaymentStatus.UNPAID);
        receipt.setLastPaidAt(null);

        StockReceipt saved = stockReceiptRepository.save(receipt);

        if (Boolean.TRUE.equals(request.getConfirmImmediately())) {
            return confirmReceiptInternal(saved, currentUser);
        }

        return StockReceiptResponse.fromEntity(saved, true);
    }

    @Transactional
    public void deleteDraftReceipt(Long id) {
        StockReceipt receipt = stockReceiptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập với ID: " + id));

        if (receipt.getStatus() == StockReceiptStatus.CONFIRMED) {
            throw new BusinessValidationException("Chỉ được phép xóa phiếu nhập ở trạng thái Nháp. Phiếu đã xác nhận nhập kho không thể xóa để bảo toàn lịch sử sổ kho.");
        }

        if (receipt.getAmountPaid() != null && receipt.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
            throw new BusinessValidationException(String.format(
                    "Không thể xóa phiếu nhập đã ghi nhận thanh toán (%s VND). Vui lòng hoàn lại hoặc điều chỉnh tiền thanh toán về 0 trước khi xóa.",
                    receipt.getAmountPaid().stripTrailingZeros().toPlainString()
            ));
        }

        stockReceiptRepository.delete(receipt);
    }

    @Transactional
    public StockReceiptResponse confirmReceipt(Long id, User currentUser) {
        StockReceipt receipt = stockReceiptRepository.findWithItemsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập với ID: " + id));

        if (receipt.getStatus() == StockReceiptStatus.CONFIRMED) {
            throw new BusinessValidationException("Phiếu nhập '" + receipt.getCode() + "' đã được xác nhận nhập kho trước đó, không thể xác nhận lại lần thứ hai.");
        }

        return confirmReceiptInternal(receipt, currentUser);
    }

    @Transactional
    public StockReceiptResponse recordPayment(Long id, StockReceiptPaymentRequest paymentRequest) {
        StockReceipt receipt = stockReceiptRepository.findWithItemsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập với ID: " + id));

        if (receipt.getStatus() == StockReceiptStatus.DRAFT) {
            throw new BusinessValidationException("Phiếu nhập đang ở trạng thái Nháp. Vui lòng xác nhận nhập kho trước khi ghi nhận thanh toán.");
        }

        if (receipt.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BusinessValidationException(String.format(
                    "Phiếu nhập '%s' đã được ghi nhận thanh toán toàn bộ trước đó (%s VND).",
                    receipt.getCode(),
                    receipt.getTotalAmount().stripTrailingZeros().toPlainString()
            ));
        }

        // Quy tắc SRS BR-11: Chỉ hỗ trợ ghi nhận thanh toán toàn bộ (PAID), không hỗ trợ trả một phần.
        if (paymentRequest.getPaymentAmount() != null && paymentRequest.getPaymentAmount().compareTo(receipt.getTotalAmount()) != 0) {
            throw new BusinessValidationException(String.format(
                    "Theo quy tắc nghiệp vụ SRS BR-11, hệ thống chỉ hỗ trợ ghi nhận thanh toán toàn bộ giá trị phiếu nhập (%s VND), không hỗ trợ thanh toán từng phần (%s VND).",
                    receipt.getTotalAmount().stripTrailingZeros().toPlainString(),
                    paymentRequest.getPaymentAmount().stripTrailingZeros().toPlainString()
            ));
        }

        receipt.setAmountPaid(receipt.getTotalAmount());
        receipt.setPaymentStatus(PaymentStatus.PAID);
        receipt.setLastPaidAt(OffsetDateTime.now(VN_ZONE));
        if (StringUtils.hasText(paymentRequest.getPaymentNote())) {
            receipt.setPaymentNote(paymentRequest.getPaymentNote().trim());
        }

        StockReceipt saved = stockReceiptRepository.save(receipt);
        return StockReceiptResponse.fromEntity(saved, true);
    }

    private StockReceiptResponse confirmReceiptInternal(StockReceipt receipt, User currentUser) {
        if (receipt.getItems().isEmpty()) {
            throw new BusinessValidationException("Phiếu nhập không có dòng nguyên liệu nào, không thể xác nhận");
        }

        if (receipt.getSupplier() == null || !receipt.getSupplier().isActive()) {
            String supplierName = receipt.getSupplier() != null ? receipt.getSupplier().getName() : "Không xác định";
            throw new BusinessValidationException("Nhà cung cấp '" + supplierName + "' đang tạm ngừng hoạt động hoặc đã bị vô hiệu hóa. Không thể xác nhận nhập kho.");
        }

        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);

        for (StockReceiptItem item : receipt.getItems()) {
            Ingredient ingredient = item.getIngredient();

            if (!ingredient.isActive()) {
                throw new BusinessValidationException("Nguyên liệu '" + ingredient.getName() + "' (Mã: " + ingredient.getCode() + ") đang tạm ẩn hoặc ngừng sử dụng. Vui lòng kích hoạt lại nguyên liệu trước khi nhập kho.");
            }

            if (!ingredient.getUnit().trim().equalsIgnoreCase(item.getUnit().trim())) {
                throw new BusinessValidationException(String.format(
                        "Đơn vị tính của nguyên liệu '%s' trên phiếu (%s) không khớp với đơn vị gốc của kho (%s). Vui lòng kiểm tra lại trước khi xác nhận.",
                        ingredient.getName(),
                        item.getUnit().trim(),
                        ingredient.getUnit().trim()
                ));
            }

            BigDecimal oldStock = ingredient.getCurrentStock();
            BigDecimal oldCost = ingredient.getAvgUnitCost();
            BigDecimal importQty = item.getQuantity();
            BigDecimal importPrice = item.getUnitPrice();

            BigDecimal newStock = oldStock.add(importQty).setScale(3, RoundingMode.HALF_UP);

            // Tính giá vốn bình quân gia quyền liên hoàn:
            // Giá vốn mới = (Tồn cũ * Giá cũ + Nhập mới * Giá nhập) / (Tồn cũ + Nhập mới)
            // Chỉ khi tồn cũ <= 0 thì mới lấy thẳng đơn giá nhập mới làm giá vốn.
            // Nếu tồn cũ > 0 và giá cũ == 0 (ví dụ hàng tồn ban đầu hoặc hàng tặng), vẫn tính bình quân gia quyền đúng chuẩn kế toán:
            // (Tồn cũ * 0 + Nhập mới * Giá nhập) / (Tồn cũ + Nhập mới)
            BigDecimal newCost;
            if (oldStock.compareTo(BigDecimal.ZERO) <= 0) {
                newCost = importPrice.setScale(4, RoundingMode.HALF_UP);
            } else {
                BigDecimal oldValue = oldStock.multiply(oldCost);
                BigDecimal newValue = importQty.multiply(importPrice);
                BigDecimal totalValue = oldValue.add(newValue);
                newCost = totalValue.divide(newStock, 4, RoundingMode.HALF_UP);
            }

            ingredient.setCurrentStock(newStock);
            ingredient.setAvgUnitCost(newCost);
            ingredientRepository.save(ingredient);

            // Ghi nhận StockMovement
            StockMovement movement = new StockMovement();
            movement.setIngredient(ingredient);
            movement.setMovementType(MovementType.IMPORT);
            movement.setQuantityChange(importQty);
            movement.setStockBefore(oldStock);
            movement.setStockAfter(newStock);
            movement.setUnitCost(importPrice.setScale(4, RoundingMode.HALF_UP));
            movement.setAvgCostBefore(oldCost);
            movement.setAvgCostAfter(newCost);
            movement.setReferenceType(ReferenceType.STOCK_RECEIPT);
            movement.setReferenceId(receipt.getId());
            movement.setReferenceCode(receipt.getCode());
            movement.setNote(String.format("Nhập kho từ NCC %s theo phiếu %s", receipt.getSupplier().getName(), receipt.getCode()));
            if (currentUser != null) {
                movement.setPerformedBy(currentUser);
                movement.setPerformedByName(currentUser.getFullName());
            } else {
                movement.setPerformedByName(receipt.getCreatedByName() != null ? receipt.getCreatedByName() : "ADMIN");
            }
            stockMovementRepository.save(movement);
        }

        receipt.setStatus(StockReceiptStatus.CONFIRMED);
        receipt.setConfirmedAt(now);
        if (currentUser != null) {
            receipt.setConfirmedBy(currentUser);
            receipt.setConfirmedByName(currentUser.getFullName());
        } else {
            receipt.setConfirmedByName("ADMIN");
        }

        StockReceipt saved = stockReceiptRepository.save(receipt);
        return StockReceiptResponse.fromEntity(saved, true);
    }

    private void validateReceiptItems(List<StockReceiptItemRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new BusinessValidationException("Phiếu nhập phải có ít nhất 01 dòng nguyên liệu");
        }
        Set<Long> seenIds = new HashSet<>();
        for (StockReceiptItemRequest it : items) {
            if (it == null) {
                throw new BusinessValidationException("Dòng nguyên liệu không được để trống");
            }
            if (it.getIngredientId() == null) {
                throw new BusinessValidationException("Mã nguyên liệu trong dòng phiếu không được để trống");
            }
            if (it.getQuantity() == null || it.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessValidationException("Số lượng nhập phải lớn hơn 0");
            }
            if (it.getUnitPrice() == null || it.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessValidationException("Đơn giá nhập không được âm");
            }
            if (!seenIds.add(it.getIngredientId())) {
                throw new BusinessValidationException("Nguyên liệu bị trùng lặp trong cùng một phiếu nhập");
            }
        }
    }

    private void buildReceiptItems(StockReceipt receipt, List<StockReceiptItemRequest> itemRequests) {
        Set<Long> ingIds = itemRequests.stream().map(StockReceiptItemRequest::getIngredientId).collect(Collectors.toSet());
        Map<Long, Ingredient> ingMap = ingredientRepository.findAllById(ingIds).stream()
                .collect(Collectors.toMap(Ingredient::getId, Function.identity()));

        if (ingMap.size() != ingIds.size()) {
            throw new ResourceNotFoundException("Một hoặc nhiều nguyên liệu trong phiếu nhập không tồn tại trong hệ thống");
        }

        int lineNo = 1;
        for (StockReceiptItemRequest req : itemRequests) {
            Ingredient ing = ingMap.get(req.getIngredientId());
            if (!ing.isActive()) {
                throw new BusinessValidationException("Nguyên liệu '" + ing.getName() + "' đang ngừng hoạt động, không thể nhập kho");
            }

            BigDecimal qty = req.getQuantity().setScale(3, RoundingMode.HALF_UP);
            BigDecimal price = req.getUnitPrice().setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = qty.multiply(price).setScale(2, RoundingMode.HALF_UP);

            StockReceiptItem item = new StockReceiptItem();
            item.setLineNo(lineNo++);
            item.setIngredient(ing);
            item.setUnit(ing.getUnit());
            item.setQuantity(qty);
            item.setUnitPrice(price);
            item.setLineTotal(lineTotal);

            receipt.addItem(item);
        }
    }

    private BigDecimal calculateTotalAmount(List<StockReceiptItem> items) {
        return items.stream()
                .map(StockReceiptItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private PaymentStatus determinePaymentStatus(BigDecimal total, BigDecimal paid) {
        if (paid != null && paid.compareTo(total) >= 0 && total.compareTo(BigDecimal.ZERO) > 0) {
            return PaymentStatus.PAID;
        }
        return PaymentStatus.UNPAID;
    }
}
