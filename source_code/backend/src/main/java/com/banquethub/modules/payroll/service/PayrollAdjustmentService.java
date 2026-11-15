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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class PayrollAdjustmentService {

    private static final Logger log = LoggerFactory.getLogger(PayrollAdjustmentService.class);

    private final PayrollAdjustmentRepository adjustmentRepository;
    private final PayrollPeriodRepository periodRepository;
    private final EmployeeRepository employeeRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    public PayrollAdjustmentService(
            PayrollAdjustmentRepository adjustmentRepository,
            PayrollPeriodRepository periodRepository,
            EmployeeRepository employeeRepository,
            org.springframework.jdbc.core.JdbcTemplate jdbc
    ) {
        this.adjustmentRepository = adjustmentRepository;
        this.periodRepository = periodRepository;
        this.employeeRepository = employeeRepository;
        this.jdbc = jdbc;
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
        if (request.payrollPeriodId() == null) {
            throw new BusinessValidationException("ID kỳ lương không được để trống.");
        }

        // Concurrency protection: lock payroll period row
        PayrollPeriod period = periodRepository.findByIdForUpdate(request.payrollPeriodId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ lương với ID: " + request.payrollPeriodId()));

        if (period.getStatus() != PayrollPeriodStatus.DRAFT) {
            throw new BusinessValidationException("Kỳ lương đã ở trạng thái " + period.getStatus() + ". Không thể thêm khoản điều chỉnh.");
        }

        Employee employee = employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + request.employeeId()));

        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Số tiền điều chỉnh phải lớn hơn 0.");
        }

        String name = request.effectiveName();
        if (name.isBlank()) {
            throw new BusinessValidationException("Tên hoặc lý do điều chỉnh không được để trống.");
        }

        PayrollAdjustment adjustment = new PayrollAdjustment();
        adjustment.setEmployee(employee);
        adjustment.setPayrollPeriod(period);
        adjustment.setAdjustmentType(request.adjustmentType());
        adjustment.setName(name);
        adjustment.setAmount(request.amount());
        adjustment.setNote(request.note() != null ? request.note().trim() : null);
        adjustment.setCreatedBy(adminName);

        PayrollAdjustment saved = adjustmentRepository.save(adjustment);

        jdbc.update("""
            INSERT INTO payroll_adjustment_audits(adjustment_id, employee_id, payroll_period_id, action, adjustment_type, old_amount, new_amount, old_name, new_name, note, audit_detail, actor_name)
            VALUES (?, ?, ?, 'CREATED', ?, NULL, ?, NULL, ?, ?, ?, ?)
        """, saved.getId(), saved.getEmployee().getId(), saved.getPayrollPeriod().getId(),
            saved.getAdjustmentType().name(), saved.getAmount(), saved.getName(), saved.getNote(), "Tạo mới khoản điều chỉnh", adminName);

        return PayrollAdjustmentDto.fromEntity(saved);
    }

    public PayrollAdjustmentDto updateAdjustment(Long id, UpdatePayrollAdjustmentRequest request) {
        return updateAdjustment(id, request, "Admin");
    }

    public PayrollAdjustmentDto updateAdjustment(Long id, UpdatePayrollAdjustmentRequest request, String adminName) {
        PayrollAdjustment initial = adjustmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản điều chỉnh với ID: " + id));

        // Concurrency protection: lock payroll period row first
        PayrollPeriod period = periodRepository.findByIdForUpdate(initial.getPayrollPeriod().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ lương của khoản điều chỉnh."));

        if (period.getStatus() != PayrollPeriodStatus.DRAFT) {
            throw new BusinessValidationException("Kỳ lương đã ở trạng thái " + period.getStatus() + ". Không thể sửa khoản điều chỉnh.");
        }

        if (request.amount() == null || request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Số tiền điều chỉnh phải lớn hơn 0.");
        }

        String name = request.effectiveName();
        if (name.isBlank()) {
            throw new BusinessValidationException("Tên hoặc lý do điều chỉnh không được để trống.");
        }

        // Re-read adjustment after acquiring period lock to ensure fresh committed data
        PayrollAdjustment adjustment = adjustmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản điều chỉnh với ID: " + id));

        BigDecimal oldAmount = adjustment.getAmount();
        String oldName = adjustment.getName();

        adjustment.setName(name);
        adjustment.setAmount(request.amount());
        adjustment.setUpdatedBy(adminName);

        String auditLog = String.format("[Sửa bởi %s: %s đ -> %s đ]", adminName, oldAmount, request.amount());
        String userNote = request.note() != null ? request.note().trim() : (adjustment.getNote() != null ? adjustment.getNote() : "");
        adjustment.setNote(userNote);

        log.info("Quản trị viên '{}' đã sửa khoản điều chỉnh ID {}: '{}' ({}) -> '{}' ({})",
                adminName, id, oldName, oldAmount, name, request.amount());

        PayrollAdjustment saved = adjustmentRepository.save(adjustment);

        jdbc.update("""
            INSERT INTO payroll_adjustment_audits(adjustment_id, employee_id, payroll_period_id, action, adjustment_type, old_amount, new_amount, old_name, new_name, note, audit_detail, actor_name)
            VALUES (?, ?, ?, 'UPDATED', ?, ?, ?, ?, ?, ?, ?, ?)
        """, id, adjustment.getEmployee().getId(), period.getId(),
            adjustment.getAdjustmentType().name(), oldAmount, request.amount(), oldName, name, userNote, auditLog, adminName);

        return PayrollAdjustmentDto.fromEntity(saved);
    }

    public void deleteAdjustment(Long id) {
        deleteAdjustment(id, "Admin");
    }

    public void deleteAdjustment(Long id, String adminName) {
        PayrollAdjustment initial = adjustmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản điều chỉnh với ID: " + id));

        // Concurrency protection: lock payroll period row
        PayrollPeriod period = periodRepository.findByIdForUpdate(initial.getPayrollPeriod().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ lương của khoản điều chỉnh."));

        if (period.getStatus() != PayrollPeriodStatus.DRAFT) {
            throw new BusinessValidationException("Kỳ lương đã ở trạng thái " + period.getStatus() + ". Không thể xóa khoản điều chỉnh.");
        }

        // Re-read adjustment after acquiring period lock
        PayrollAdjustment adjustment = adjustmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản điều chỉnh với ID: " + id));

        log.info("Quản trị viên '{}' đã xóa khoản điều chỉnh ID {} ({}, {} đ) của nhân viên ID {}",
                adminName, id, adjustment.getName(), adjustment.getAmount(), adjustment.getEmployee().getId());

        jdbc.update("""
            INSERT INTO payroll_adjustment_audits(adjustment_id, employee_id, payroll_period_id, action, adjustment_type, old_amount, new_amount, old_name, new_name, note, audit_detail, actor_name)
            VALUES (?, ?, ?, 'DELETED', ?, ?, NULL, ?, NULL, ?, ?, ?)
        """, id, adjustment.getEmployee().getId(), period.getId(),
            adjustment.getAdjustmentType().name(), adjustment.getAmount(), adjustment.getName(), adjustment.getNote(),
            String.format("[Xóa bởi %s: %s đ]", adminName, adjustment.getAmount()), adminName);

        adjustmentRepository.delete(adjustment);
    }
}
