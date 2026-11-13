package com.banquethub.modules.payroll.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.employees.entity.Employee;
import com.banquethub.modules.employees.repository.EmployeeRepository;
import com.banquethub.modules.payroll.dto.CreatePayrollAdjustmentRequest;
import com.banquethub.modules.payroll.dto.PayrollAdjustmentDto;
import com.banquethub.modules.payroll.dto.UpdatePayrollAdjustmentRequest;
import com.banquethub.modules.payroll.entity.PayrollAdjustment;
import com.banquethub.modules.payroll.entity.PayrollPeriod;
import com.banquethub.modules.payroll.entity.PayrollPeriodStatus;
import com.banquethub.modules.payroll.repository.PayrollAdjustmentRepository;
import com.banquethub.modules.payroll.repository.PayrollPeriodRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class PayrollAdjustmentService {

    private final PayrollAdjustmentRepository adjustmentRepository;
    private final PayrollPeriodRepository periodRepository;
    private final EmployeeRepository employeeRepository;

    public PayrollAdjustmentService(
            PayrollAdjustmentRepository adjustmentRepository,
            PayrollPeriodRepository periodRepository,
            EmployeeRepository employeeRepository
    ) {
        this.adjustmentRepository = adjustmentRepository;
        this.periodRepository = periodRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<PayrollAdjustmentDto> getAdjustments(Long payrollPeriodId, Long employeeId) {
        List<PayrollAdjustment> list;
        if (employeeId != null) {
            list = adjustmentRepository.findByPayrollPeriodIdAndEmployeeId(payrollPeriodId, employeeId);
        } else {
            list = adjustmentRepository.findByPayrollPeriodId(payrollPeriodId);
        }
        return list.stream().map(PayrollAdjustmentDto::fromEntity).toList();
    }

    public PayrollAdjustmentDto createAdjustment(CreatePayrollAdjustmentRequest request, String adminName) {
        PayrollPeriod period = periodRepository.findById(request.payrollPeriodId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ lương với ID: " + request.payrollPeriodId()));

        if (period.getStatus() != PayrollPeriodStatus.DRAFT) {
            throw new BusinessValidationException("Kỳ lương đã ở trạng thái " + period.getStatus() + ". Không thể thêm khoản điều chỉnh.");
        }

        Employee employee = employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + request.employeeId()));

        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Số tiền điều chỉnh phải lớn hơn 0.");
        }

        PayrollAdjustment adjustment = new PayrollAdjustment();
        adjustment.setEmployee(employee);
        adjustment.setPayrollPeriod(period);
        adjustment.setAdjustmentType(request.adjustmentType());
        adjustment.setName(request.name().trim());
        adjustment.setAmount(request.amount());
        adjustment.setNote(request.note() != null ? request.note().trim() : null);
        adjustment.setCreatedBy(adminName);

        PayrollAdjustment saved = adjustmentRepository.save(adjustment);
        return PayrollAdjustmentDto.fromEntity(saved);
    }

    public PayrollAdjustmentDto updateAdjustment(Long id, UpdatePayrollAdjustmentRequest request) {
        PayrollAdjustment adjustment = adjustmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản điều chỉnh với ID: " + id));

        PayrollPeriod period = adjustment.getPayrollPeriod();
        if (period.getStatus() != PayrollPeriodStatus.DRAFT) {
            throw new BusinessValidationException("Kỳ lương đã ở trạng thái " + period.getStatus() + ". Không thể sửa khoản điều chỉnh.");
        }

        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Số tiền điều chỉnh phải lớn hơn 0.");
        }

        adjustment.setName(request.name().trim());
        adjustment.setAmount(request.amount());
        adjustment.setNote(request.note() != null ? request.note().trim() : null);

        PayrollAdjustment saved = adjustmentRepository.save(adjustment);
        return PayrollAdjustmentDto.fromEntity(saved);
    }

    public void deleteAdjustment(Long id) {
        PayrollAdjustment adjustment = adjustmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản điều chỉnh với ID: " + id));

        PayrollPeriod period = adjustment.getPayrollPeriod();
        if (period.getStatus() != PayrollPeriodStatus.DRAFT) {
            throw new BusinessValidationException("Kỳ lương đã ở trạng thái " + period.getStatus() + ". Không thể xóa khoản điều chỉnh.");
        }

        adjustmentRepository.delete(adjustment);
    }
}
