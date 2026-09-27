package com.banquethub.modules.suppliers.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.DuplicateResourceException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.inventory.dto.StockReceiptResponse;
import com.banquethub.modules.inventory.entity.StockReceipt;
import com.banquethub.modules.inventory.repository.StockReceiptRepository;
import com.banquethub.modules.suppliers.dto.SupplierRequest;
import com.banquethub.modules.suppliers.dto.SupplierResponse;
import com.banquethub.modules.suppliers.entity.Supplier;
import com.banquethub.modules.suppliers.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final StockReceiptRepository stockReceiptRepository;

    public SupplierService(
            SupplierRepository supplierRepository,
            StockReceiptRepository stockReceiptRepository
    ) {
        this.supplierRepository = supplierRepository;
        this.stockReceiptRepository = stockReceiptRepository;
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> searchSuppliers(String keyword, Boolean active) {
        List<Supplier> suppliers = supplierRepository.findByActiveFilter(active);
        if (StringUtils.hasText(keyword)) {
            String kw = keyword.trim().toLowerCase();
            suppliers = suppliers.stream().filter(s ->
                    (s.getName() != null && s.getName().toLowerCase().contains(kw))
                    || (s.getPhone() != null && s.getPhone().contains(kw))
                    || (s.getCode() != null && s.getCode().toLowerCase().contains(kw))
            ).toList();
        }
        return suppliers.stream().map(s -> {
            BigDecimal totalPurchased = stockReceiptRepository.sumConfirmedPurchasedBySupplierId(s.getId());
            long receiptsCount = stockReceiptRepository.countBySupplierId(s.getId());
            return SupplierResponse.fromEntity(s, totalPurchased, receiptsCount);
        }).toList();
    }

    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + id));
        BigDecimal totalPurchased = stockReceiptRepository.sumConfirmedPurchasedBySupplierId(supplier.getId());
        long receiptsCount = stockReceiptRepository.countBySupplierId(supplier.getId());
        return SupplierResponse.fromEntity(supplier, totalPurchased, receiptsCount);
    }

    @Transactional(readOnly = true)
    public List<StockReceiptResponse> getSupplierReceipts(Long supplierId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + supplierId);
        }
        List<StockReceipt> receipts = stockReceiptRepository.findBySupplierIdOrderByReceiptDateDescIdDesc(supplierId);
        return receipts.stream()
                .map(r -> StockReceiptResponse.fromEntity(r, false))
                .toList();
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request) {
        String phone = request.getPhone().trim();
        if (supplierRepository.existsByPhone(phone)) {
            throw new DuplicateResourceException("Số điện thoại '" + phone + "' đã được sử dụng cho một nhà cung cấp khác");
        }

        String code = request.getCode() != null && StringUtils.hasText(request.getCode())
                ? request.getCode().trim().toUpperCase(Locale.ROOT)
                : generateSupplierCode();

        if (supplierRepository.existsByCodeIgnoreCase(code)) {
            throw new DuplicateResourceException("Mã nhà cung cấp '" + code + "' đã tồn tại");
        }

        Supplier supplier = new Supplier();
        supplier.setCode(code);
        supplier.setName(request.getName().trim());
        supplier.setPhone(phone);
        supplier.setEmail(StringUtils.hasText(request.getEmail()) ? request.getEmail().trim().toLowerCase(Locale.ROOT) : null);
        supplier.setAddress(StringUtils.hasText(request.getAddress()) ? request.getAddress().trim() : null);
        supplier.setNote(StringUtils.hasText(request.getNote()) ? request.getNote().trim() : null);
        supplier.setActive(request.getActive() == null || request.getActive());

        Supplier saved = supplierRepository.save(supplier);
        return SupplierResponse.fromEntity(saved, BigDecimal.ZERO, 0);
    }

    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + id));

        String phone = request.getPhone().trim();
        if (supplierRepository.existsByPhoneAndIdNot(phone, id)) {
            throw new DuplicateResourceException("Số điện thoại '" + phone + "' đã được sử dụng cho một nhà cung cấp khác");
        }

        if (StringUtils.hasText(request.getCode())) {
            String newCode = request.getCode().trim().toUpperCase(Locale.ROOT);
            if (!supplier.getCode().equalsIgnoreCase(newCode) && supplierRepository.existsByCodeIgnoreCase(newCode)) {
                throw new DuplicateResourceException("Mã nhà cung cấp '" + newCode + "' đã tồn tại");
            }
            supplier.setCode(newCode);
        }

        supplier.setName(request.getName().trim());
        supplier.setPhone(phone);
        supplier.setEmail(StringUtils.hasText(request.getEmail()) ? request.getEmail().trim().toLowerCase(Locale.ROOT) : null);
        supplier.setAddress(StringUtils.hasText(request.getAddress()) ? request.getAddress().trim() : null);
        supplier.setNote(StringUtils.hasText(request.getNote()) ? request.getNote().trim() : null);
        if (request.getActive() != null) {
            supplier.setActive(request.getActive());
        }

        Supplier saved = supplierRepository.save(supplier);
        BigDecimal totalPurchased = stockReceiptRepository.sumConfirmedPurchasedBySupplierId(saved.getId());
        long receiptsCount = stockReceiptRepository.countBySupplierId(saved.getId());
        return SupplierResponse.fromEntity(saved, totalPurchased, receiptsCount);
    }

    @Transactional
    public SupplierResponse toggleSupplierActive(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp với ID: " + id));
        supplier.setActive(!supplier.isActive());
        Supplier saved = supplierRepository.save(supplier);
        BigDecimal totalPurchased = stockReceiptRepository.sumConfirmedPurchasedBySupplierId(saved.getId());
        long receiptsCount = stockReceiptRepository.countBySupplierId(saved.getId());
        return SupplierResponse.fromEntity(saved, totalPurchased, receiptsCount);
    }

    private String generateSupplierCode() {
        Long seq = supplierRepository.getNextSupplierCodeSeq();
        return String.format("NCC-%04d", seq);
    }
}
