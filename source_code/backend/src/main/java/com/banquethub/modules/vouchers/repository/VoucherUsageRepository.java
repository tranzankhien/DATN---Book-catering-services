package com.banquethub.modules.vouchers.repository;

import com.banquethub.modules.vouchers.entity.VoucherUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VoucherUsageRepository extends JpaRepository<VoucherUsage, Long> {
    long countByVoucherIdAndUserId(Long voucherId, Long userId);
}
