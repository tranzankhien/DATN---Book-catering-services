package com.banquethub.modules.payroll.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.payroll.dto.RecordSalaryPaymentRequest;
import com.banquethub.modules.payroll.dto.SalaryPaymentDto;
import com.banquethub.modules.payroll.entity.*;
import com.banquethub.modules.payroll.repository.PayrollPeriodRepository;
import com.banquethub.modules.payroll.repository.PayrollRepository;
import com.banquethub.modules.payroll.repository.SalaryPaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@Transactional
public class SalaryPaymentService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final SalaryPaymentRepository salaryPaymentRepository;
    private final PayrollRepository payrollRepository;
    private final PayrollPeriodRepository periodRepository;

    public SalaryPaymentService(
            SalaryPaymentRepository salaryPaymentRepository,
            PayrollRepository payrollRepository,
            PayrollPeriodRepository periodRepository
    ) {
        this.salaryPaymentRepository = salaryPaymentRepository;
        this.payrollRepository = payrollRepository;
        this.periodRepository = periodRepository;
    }

    @Transactional(readOnly = true)
    public List<SalaryPaymentDto> getAllPayments() {
        return salaryPaymentRepository.findAllWithDetails()
                .stream()
                .map(SalaryPaymentDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public SalaryPaymentDto getPaymentByPayrollId(Long payrollId) {
        return salaryPaymentRepository.findByPayrollId(payrollId)
                .map(SalaryPaymentDto::fromEntity)
                .orElse(null);
    }

    public SalaryPaymentDto recordPayment(Long payrollId, RecordSalaryPaymentRequest request, String adminName) {
        // Concurrency lock: pessimistic write lock on the target payroll row
        Payroll payroll = payrollRepository.findByIdForUpdate(payrollId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bảng lương với ID: " + payrollId));

        // Concurrency lock: pessimistic write lock on parent payroll_periods row to serialize concurrent payments and auto-close
        PayrollPeriod period = periodRepository.findByIdForUpdate(payroll.getPayrollPeriod().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ lương của bảng lương."));

        if (period.getStatus() == PayrollPeriodStatus.DRAFT) {
            throw new BusinessValidationException("Không thể ghi nhận thanh toán cho kỳ lương đang ở trạng thái DRAFT. Vui lòng chốt kỳ lương trước.");
        }

        if (payroll.getPaymentStatus() == PaymentStatus.PAID || salaryPaymentRepository.existsByPayrollId(payrollId)) {
            throw new BusinessValidationException("Bảng lương này đã được ghi nhận thanh toán trước đó. Không thể thanh toán trùng.");
        }

        LocalDate todayVn = LocalDate.now(VN_ZONE);
        LocalDate paymentDate = request.paymentDate() != null ? request.paymentDate() : todayVn;
        if (paymentDate.isAfter(todayVn)) {
            throw new BusinessValidationException("Ngày thanh toán (" + paymentDate + ") không được lớn hơn ngày hiện tại (" + todayVn + ").");
        }

        SalaryPayment payment = new SalaryPayment();
        payment.setPayroll(payroll);
        payment.setAmount(payroll.getNetSalary()); // Strictly full net salary
        payment.setPaymentDate(paymentDate);
        payment.setPaymentMethod(request.paymentMethod());
        payment.setNote(request.note() != null ? request.note().trim() : null);
        payment.setRecordedBy(adminName);

        SalaryPayment savedPayment = salaryPaymentRepository.save(payment);

        payroll.setPaymentStatus(PaymentStatus.PAID);
        payrollRepository.save(payroll);

        // Auto-close period if all payrolls in this period are now PAID
        long remainingUnpaid = payrollRepository.countByPayrollPeriodIdAndPaymentStatus(period.getId(), PaymentStatus.UNPAID);
        if (remainingUnpaid == 0 && period.getStatus() == PayrollPeriodStatus.FINALIZED) {
            period.setStatus(PayrollPeriodStatus.CLOSED);
            period.setClosedAt(OffsetDateTime.now(VN_ZONE));
            periodRepository.save(period);
        }

        return SalaryPaymentDto.fromEntity(savedPayment);
    }
}
