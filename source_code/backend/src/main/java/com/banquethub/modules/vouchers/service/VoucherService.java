package com.banquethub.modules.vouchers.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.orders.entity.Order;
import com.banquethub.modules.users.entity.User;
import com.banquethub.modules.vouchers.dto.CreateVoucherRequest;
import com.banquethub.modules.vouchers.dto.UpdateVoucherRequest;
import com.banquethub.modules.vouchers.dto.VoucherDto;
import com.banquethub.modules.vouchers.dto.VoucherValidationResponse;
import com.banquethub.modules.vouchers.entity.DiscountType;
import com.banquethub.modules.vouchers.entity.Voucher;
import com.banquethub.modules.vouchers.entity.VoucherUsage;
import com.banquethub.modules.vouchers.repository.VoucherRepository;
import com.banquethub.modules.vouchers.repository.VoucherUsageRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.time.OffsetDateTime;
import java.util.List;

@Service
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final VoucherUsageRepository voucherUsageRepository;
    private final DecimalFormat currencyFormatter = new DecimalFormat("#,###");

    public VoucherService(VoucherRepository voucherRepository, VoucherUsageRepository voucherUsageRepository) {
        this.voucherRepository = voucherRepository;
        this.voucherUsageRepository = voucherUsageRepository;
    }

    @Transactional(readOnly = true)
    public VoucherValidationResponse validateAndCalculate(String code, BigDecimal orderAmount, Long userId) {
        if (code == null || code.trim().isEmpty()) {
            return VoucherValidationResponse.invalid("Vui lòng nhập mã giảm giá");
        }

        String cleanCode = code.trim().toUpperCase();
        Voucher voucher = voucherRepository.findByCodeIgnoreCase(cleanCode)
                .orElse(null);

        if (voucher == null) {
            return VoucherValidationResponse.invalid("Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa");
        }

        if (Boolean.FALSE.equals(voucher.getIsActive())) {
            return VoucherValidationResponse.invalid("Mã giảm giá hiện đang tạm dừng áp dụng");
        }

        OffsetDateTime now = OffsetDateTime.now();
        if (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate())) {
            return VoucherValidationResponse.invalid("Mã giảm giá chưa đến thời gian áp dụng");
        }

        if (voucher.getEndDate() != null && now.isAfter(voucher.getEndDate())) {
            return VoucherValidationResponse.invalid("Mã giảm giá đã hết hạn sử dụng");
        }

        if (voucher.getUsageLimit() != null && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            return VoucherValidationResponse.invalid("Mã giảm giá đã hết lượt sử dụng trên toàn hệ thống");
        }

        if (voucher.getMinOrderAmount() != null && orderAmount.compareTo(voucher.getMinOrderAmount()) < 0) {
            return VoucherValidationResponse.invalid(String.format(
                    "Đơn tiệc chưa đạt giá trị tối thiểu (Yêu cầu đơn từ %s ₫)",
                    currencyFormatter.format(voucher.getMinOrderAmount())
            ));
        }

        if (userId != null && voucher.getLimitPerUser() != null && voucher.getLimitPerUser() > 0) {
            long usedByUser = voucherUsageRepository.countByVoucherIdAndUserId(voucher.getId(), userId);
            if (usedByUser >= voucher.getLimitPerUser()) {
                return VoucherValidationResponse.invalid("Tài khoản của bạn đã sử dụng hết lượt cho mã giảm giá này");
            }
        }

        BigDecimal discount = BigDecimal.ZERO;
        if (voucher.getDiscountType() == DiscountType.FIXED) {
            discount = voucher.getDiscountValue();
        } else if (voucher.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = orderAmount.multiply(voucher.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (voucher.getMaxDiscountAmount() != null && discount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                discount = voucher.getMaxDiscountAmount();
            }
        }

        if (discount.compareTo(orderAmount) > 0) {
            discount = orderAmount;
        }

        BigDecimal finalAmount = orderAmount.subtract(discount);
        return VoucherValidationResponse.success(voucher.getCode(), voucher.getName(), discount, finalAmount);
    }

    @Transactional
    public void recordVoucherUsage(String code, User user, Order order, BigDecimal discountAmount) {
        if (code == null || code.trim().isEmpty()) return;

        Voucher voucher = voucherRepository.findByCodeIgnoreCase(code.trim().toUpperCase())
                .orElse(null);
        if (voucher == null) return;

        VoucherUsage usage = new VoucherUsage();
        usage.setVoucher(voucher);
        usage.setUser(user);
        usage.setOrder(order);
        usage.setDiscountAmount(discountAmount != null ? discountAmount : BigDecimal.ZERO);
        voucherUsageRepository.save(usage);

        voucher.setUsedCount(voucher.getUsedCount() + 1);
        voucherRepository.save(voucher);
    }

    // =========================================================================
    // ADMIN CRUD
    // =========================================================================

    @Transactional(readOnly = true)
    public List<VoucherDto> getAllVouchers() {
        return voucherRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(VoucherDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public VoucherDto getVoucherById(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với mã ID: " + id));
        return VoucherDto.fromEntity(voucher);
    }

    @Transactional
    public VoucherDto createVoucher(CreateVoucherRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase();
        if (voucherRepository.existsByCodeIgnoreCase(cleanCode)) {
            throw new BusinessValidationException("Mã voucher '" + cleanCode + "' đã tồn tại trên hệ thống");
        }

        if (request.getStartDate() != null && request.getEndDate() != null && request.getStartDate().isAfter(request.getEndDate())) {
            throw new BusinessValidationException("Thời gian bắt đầu không được sau thời gian kết thúc");
        }

        if (request.getDiscountType() == DiscountType.PERCENTAGE) {
            if (request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new BusinessValidationException("Phần trăm giảm giá không được vượt quá 100%");
            }
        }

        Voucher v = new Voucher();
        v.setCode(cleanCode);
        v.setName(request.getName().trim());
        v.setDescription(request.getDescription());
        v.setDiscountType(request.getDiscountType());
        v.setDiscountValue(request.getDiscountValue());
        v.setMaxDiscountAmount(request.getMaxDiscountAmount());
        v.setMinOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO);
        v.setStartDate(request.getStartDate());
        v.setEndDate(request.getEndDate());
        v.setUsageLimit(request.getUsageLimit());
        v.setLimitPerUser(request.getLimitPerUser() != null ? request.getLimitPerUser() : 1);
        v.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        v.setUsedCount(0);

        Voucher saved = voucherRepository.save(v);
        return VoucherDto.fromEntity(saved);
    }

    @Transactional
    public VoucherDto updateVoucher(Long id, UpdateVoucherRequest request) {
        Voucher v = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với mã ID: " + id));

        if (request.getStartDate() != null && request.getEndDate() != null && request.getStartDate().isAfter(request.getEndDate())) {
            throw new BusinessValidationException("Thời gian bắt đầu không được sau thời gian kết thúc");
        }

        if (request.getDiscountType() == DiscountType.PERCENTAGE) {
            if (request.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new BusinessValidationException("Phần trăm giảm giá không được vượt quá 100%");
            }
        }

        v.setName(request.getName().trim());
        v.setDescription(request.getDescription());
        v.setDiscountType(request.getDiscountType());
        v.setDiscountValue(request.getDiscountValue());
        v.setMaxDiscountAmount(request.getMaxDiscountAmount());
        if (request.getMinOrderAmount() != null) {
            v.setMinOrderAmount(request.getMinOrderAmount());
        }
        v.setStartDate(request.getStartDate());
        v.setEndDate(request.getEndDate());
        v.setUsageLimit(request.getUsageLimit());
        if (request.getLimitPerUser() != null) {
            v.setLimitPerUser(request.getLimitPerUser());
        }
        if (request.getIsActive() != null) {
            v.setIsActive(request.getIsActive());
        }

        Voucher updated = voucherRepository.save(v);
        return VoucherDto.fromEntity(updated);
    }

    @Transactional
    public VoucherDto toggleActive(Long id) {
        Voucher v = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với mã ID: " + id));
        v.setIsActive(!Boolean.TRUE.equals(v.getIsActive()));
        Voucher saved = voucherRepository.save(v);
        return VoucherDto.fromEntity(saved);
    }

    @Transactional
    public void deleteVoucher(Long id) {
        Voucher v = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy voucher với mã ID: " + id));
        if (v.getUsedCount() > 0) {
            throw new BusinessValidationException("Không thể xóa voucher đã có lượt sử dụng trong các đơn hàng thực tế. Bạn có thể chọn Tạm dừng (vô hiệu hóa) voucher này.");
        }
        voucherRepository.delete(v);
    }
}
