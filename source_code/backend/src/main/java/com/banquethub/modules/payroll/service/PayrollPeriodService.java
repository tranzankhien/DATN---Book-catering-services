package com.banquethub.modules.payroll.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.DuplicateResourceException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.attendance.entity.Attendance;
import com.banquethub.modules.attendance.repository.AttendanceRepository;
import com.banquethub.modules.employees.entity.Employee;
import com.banquethub.modules.employees.entity.EmployeeStatus;
import com.banquethub.modules.employees.repository.EmployeeRepository;
import com.banquethub.modules.payroll.dto.*;
import com.banquethub.modules.payroll.entity.*;
import com.banquethub.modules.payroll.repository.PayrollAdjustmentRepository;
import com.banquethub.modules.payroll.repository.PayrollPeriodRepository;
import com.banquethub.modules.payroll.repository.PayrollRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class PayrollPeriodService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final PayrollPeriodRepository periodRepository;
    private final PayrollRepository payrollRepository;
    private final PayrollAdjustmentRepository adjustmentRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final PayrollCalculationService calculationService;

    public PayrollPeriodService(
            PayrollPeriodRepository periodRepository,
            PayrollRepository payrollRepository,
            PayrollAdjustmentRepository adjustmentRepository,
            EmployeeRepository employeeRepository,
            AttendanceRepository attendanceRepository,
            PayrollCalculationService calculationService
    ) {
        this.periodRepository = periodRepository;
        this.payrollRepository = payrollRepository;
        this.adjustmentRepository = adjustmentRepository;
        this.employeeRepository = employeeRepository;
        this.attendanceRepository = attendanceRepository;
        this.calculationService = calculationService;
    }

    @Transactional(readOnly = true)
    public List<PayrollPeriodDto> getPayrollPeriods() {
        return periodRepository.findAllByOrderByYearDescMonthDesc()
                .stream()
                .map(this::enrichPeriodDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PayrollPeriodDto getPayrollPeriodById(Long id) {
        PayrollPeriod period = periodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ lương với ID: " + id));
        return enrichPeriodDto(period);
    }

    public PayrollPeriodDto createPeriod(CreatePayrollPeriodRequest request, String adminName) {
        if (request.standardWorkdays() == null || request.standardWorkdays().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Số ngày công chuẩn phải lớn hơn 0.");
        }

        if (periodRepository.existsByYearAndMonth(request.year(), request.month())) {
            throw new DuplicateResourceException(String.format("Kỳ lương tháng %d/%d đã tồn tại.", request.month(), request.year()));
        }

        PayrollPeriod period = new PayrollPeriod();
        period.setYear(request.year());
        period.setMonth(request.month());
        period.setStandardWorkdays(request.standardWorkdays());
        period.setStatus(PayrollPeriodStatus.DRAFT);
        period.setNote(request.note() != null ? request.note().trim() : null);
        period.setCreatedBy(adminName);

        PayrollPeriod saved = periodRepository.save(period);
        return enrichPeriodDto(saved);
    }

    public PayrollPeriodDto updatePeriod(Long id, UpdatePayrollPeriodRequest request) {
        // Concurrency protection: lock payroll period row
        PayrollPeriod period = periodRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ lương với ID: " + id));

        if (period.getStatus() != PayrollPeriodStatus.DRAFT) {
            throw new BusinessValidationException("Kỳ lương đã ở trạng thái " + period.getStatus() + ". Không thể chỉnh sửa cấu hình.");
        }

        if (request.standardWorkdays() == null || request.standardWorkdays().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Số ngày công chuẩn phải lớn hơn 0.");
        }

        period.setStandardWorkdays(request.standardWorkdays());
        if (request.note() != null) {
            period.setNote(request.note().trim());
        }

        PayrollPeriod saved = periodRepository.save(period);
        return enrichPeriodDto(saved);
    }

    @Transactional(readOnly = true)
    public PayrollPeriodPreviewDto previewPayroll(Long periodId) {
        PayrollPeriod period = periodRepository.findById(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ lương với ID: " + periodId));

        YearMonth ym = YearMonth.of(period.getYear(), period.getMonth());
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();
        int daysInMonth = ym.lengthOfMonth();

        List<Employee> allEmployees = employeeRepository.findAll();
        List<Attendance> attendances = attendanceRepository.findByWorkDateBetweenOrderByWorkDateAsc(start, end);
        Map<Long, List<Attendance>> empAttendanceMap = attendances.stream()
                .collect(Collectors.groupingBy(a -> a.getEmployee().getId()));

        List<PayrollAdjustment> adjustments = adjustmentRepository.findByPayrollPeriodId(periodId);
        Map<Long, List<PayrollAdjustment>> empAdjustmentMap = adjustments.stream()
                .collect(Collectors.groupingBy(a -> a.getEmployee().getId()));

        List<PayrollPeriodPreviewDto.PayrollPreviewItemDto> items = new ArrayList<>();
        BigDecimal totalCalc = BigDecimal.ZERO;
        BigDecimal totalAllowances = BigDecimal.ZERO;
        BigDecimal totalDeductions = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;
        boolean canFinalize = true;
        List<String> globalWarnings = new ArrayList<>();

        if (period.getStandardWorkdays() == null || period.getStandardWorkdays().compareTo(BigDecimal.ZERO) <= 0) {
            canFinalize = false;
            globalWarnings.add("Số công chuẩn của kỳ không hợp lệ (phải > 0).");
        }

        for (Employee emp : allEmployees) {
            List<Attendance> empRecords = empAttendanceMap.getOrDefault(emp.getId(), Collections.emptyList());
            List<PayrollAdjustment> empAdjustments = empAdjustmentMap.getOrDefault(emp.getId(), Collections.emptyList());

            // Skip inactive employees if they have 0 attendance and 0 adjustments
            if (emp.getStatus() == EmployeeStatus.INACTIVE && empRecords.isEmpty() && empAdjustments.isEmpty()) {
                continue;
            }

            // Strictly exclude any attendance record prior to employee's hire date
            BigDecimal actualWorkdays = empRecords.stream()
                    .filter(a -> emp.getHireDate() == null || !a.getWorkDate().isBefore(emp.getHireDate()))
                    .map(Attendance::getWorkUnits)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal empAllowances = empAdjustments.stream()
                    .filter(a -> a.getAdjustmentType() == AdjustmentType.ALLOWANCE)
                    .map(PayrollAdjustment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal empDeductions = empAdjustments.stream()
                    .filter(a -> a.getAdjustmentType() == AdjustmentType.DEDUCTION)
                    .map(PayrollAdjustment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal calculatedSalary = calculationService.calculateSalaryByWorkdays(
                    emp.getBaseSalary(),
                    actualWorkdays,
                    period.getStandardWorkdays()
            );

            BigDecimal netSalary = calculationService.calculateNetSalary(
                    calculatedSalary,
                    empAllowances,
                    empDeductions
            );

            List<String> itemWarnings = new ArrayList<>();
            if (emp.getHireDate() != null) {
                boolean hasPriorToHire = empRecords.stream().anyMatch(a -> a.getWorkDate().isBefore(emp.getHireDate()));
                if (hasPriorToHire) {
                    itemWarnings.add("Có bản ghi chấm công trước ngày vào làm (đã loại khỏi tính công).");
                }
            }
            if (empRecords.size() < daysInMonth) {
                itemWarnings.add(String.format("Có %d ngày chưa được ghi nhận công trong tháng.", daysInMonth - empRecords.size()));
            }

            if (actualWorkdays.compareTo(period.getStandardWorkdays()) > 0) {
                canFinalize = false;
                itemWarnings.add(String.format("Số công thực tế (%.1f) vượt số công chuẩn (%.1f). Vui lòng điều chỉnh lại công hoặc ngày công chuẩn trước khi chốt.", actualWorkdays, period.getStandardWorkdays()));
            }

            if (netSalary.compareTo(BigDecimal.ZERO) < 0) {
                canFinalize = false;
                itemWarnings.add("Thực lĩnh bị âm (khấu trừ lớn hơn lương theo công + phụ cấp). Cần điều chỉnh giảm khấu trừ trước khi chốt.");
            }

            totalCalc = totalCalc.add(calculatedSalary);
            totalAllowances = totalAllowances.add(empAllowances);
            totalDeductions = totalDeductions.add(empDeductions);
            totalNet = totalNet.add(netSalary);

            items.add(new PayrollPeriodPreviewDto.PayrollPreviewItemDto(
                    emp.getId(),
                    emp.getEmployeeCode(),
                    emp.getFullName(),
                    emp.getPosition(),
                    emp.getBaseSalary(),
                    period.getStandardWorkdays(),
                    actualWorkdays,
                    calculatedSalary,
                    empAllowances,
                    empDeductions,
                    netSalary,
                    itemWarnings
            ));
        }

        items.sort(Comparator.comparing(PayrollPeriodPreviewDto.PayrollPreviewItemDto::employeeId));
        String previewHash = computePreviewHash(items);

        return new PayrollPeriodPreviewDto(
                period.getId(),
                period.getYear(),
                period.getMonth(),
                period.getStandardWorkdays(),
                period.getStatus(),
                items.size(),
                totalCalc,
                totalAllowances,
                totalDeductions,
                totalNet,
                canFinalize,
                globalWarnings,
                items,
                previewHash
        );
    }

    public List<PayrollDto> finalizePeriod(Long periodId, String adminName) {
        return finalizePeriod(periodId, null, adminName);
    }

    public List<PayrollDto> finalizePeriod(Long periodId, FinalizePayrollPeriodRequest request, String adminName) {
        // Concurrency protection: pessimistic write lock on period row
        PayrollPeriod period = periodRepository.findByIdForUpdate(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ lương với ID: " + periodId));

        if (period.getStatus() != PayrollPeriodStatus.DRAFT) {
            throw new BusinessValidationException("Kỳ lương đã ở trạng thái " + period.getStatus() + ". Không thể chốt lại kỳ.");
        }

        if (period.getStandardWorkdays() == null || period.getStandardWorkdays().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Số ngày công chuẩn phải lớn hơn 0.");
        }

        PayrollPeriodPreviewDto preview = previewPayroll(periodId);
        if (!preview.canFinalize()) {
            throw new BusinessValidationException("Không thể chốt bảng lương do có nhân viên có lương thực lĩnh âm hoặc số công vượt công chuẩn. Vui lòng rà soát cảnh báo.");
        }

        // Integrity check: verify that preview data matches what the admin reviewed
        if (request != null) {
            if (request.previewHash() != null && !request.previewHash().isBlank() &&
                    !preview.previewHash().equals(request.previewHash())) {
                throw new BusinessValidationException(
                        "Bảng lương đã bị thay đổi chi tiết từng nhân viên (mức lương, công hoặc phụ cấp) kể từ lần xem trước gần nhất. Vui lòng tải lại bản xem trước để rà soát trước khi chốt."
                );
            }
            if (request.expectedTotalNetSalary() != null &&
                    preview.totalNetSalary().compareTo(request.expectedTotalNetSalary()) != 0) {
                throw new BusinessValidationException(String.format(
                        "Số liệu bảng lương đã bị thay đổi bởi quản trị viên khác kể từ lần xem trước gần nhất (Thực lĩnh xem trước: %s đ, thực tế hiện tại: %s đ). Vui lòng tải lại bản xem trước để rà soát trước khi chốt.",
                        request.expectedTotalNetSalary(), preview.totalNetSalary()
                ));
            }
            if (request.expectedEmployeeCount() != null &&
                    preview.items().size() != request.expectedEmployeeCount()) {
                throw new BusinessValidationException(String.format(
                        "Số lượng nhân viên trong bảng lương đã thay đổi (Xem trước: %d, thực tế: %d). Vui lòng tải lại bản xem trước.",
                        request.expectedEmployeeCount(), preview.items().size()
                ));
            }
        }

        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);
        List<Payroll> savedPayrolls = new ArrayList<>();

        for (PayrollPeriodPreviewDto.PayrollPreviewItemDto item : preview.items()) {
            Employee employee = employeeRepository.findById(item.employeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên ID: " + item.employeeId()));

            Payroll payroll = new Payroll();
            payroll.setEmployee(employee);
            payroll.setPayrollPeriod(period);
            payroll.setEmployeeCodeSnapshot(item.employeeCode());
            payroll.setEmployeeNameSnapshot(item.employeeName());
            payroll.setBaseSalarySnapshot(item.baseSalary());
            payroll.setStandardWorkdaysSnapshot(item.standardWorkdays());
            payroll.setActualWorkdaysSnapshot(item.actualWorkdays());
            payroll.setCalculatedSalary(item.calculatedSalary());
            payroll.setTotalAllowances(item.totalAllowances());
            payroll.setTotalDeductions(item.totalDeductions());
            payroll.setNetSalary(item.netSalary());
            payroll.setPaymentStatus(PaymentStatus.UNPAID);
            payroll.setFinalizedAt(now);

            savedPayrolls.add(payrollRepository.save(payroll));
        }

        period.setStatus(PayrollPeriodStatus.FINALIZED);
        period.setFinalizedBy(adminName);
        period.setFinalizedAt(now);
        periodRepository.save(period);

        return savedPayrolls.stream().map(PayrollDto::fromEntity).toList();
    }

    public PayrollPeriodDto closePeriod(Long periodId, String adminName) {
        PayrollPeriod period = periodRepository.findByIdForUpdate(periodId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ lương với ID: " + periodId));

        if (period.getStatus() == PayrollPeriodStatus.DRAFT) {
            throw new BusinessValidationException("Kỳ lương đang ở trạng thái DRAFT. Cần chốt bảng lương trước khi đóng kỳ.");
        }
        if (period.getStatus() == PayrollPeriodStatus.CLOSED) {
            return PayrollPeriodDto.fromEntity(period);
        }

        long unpaidCount = payrollRepository.countByPayrollPeriodIdAndPaymentStatus(periodId, PaymentStatus.UNPAID);
        if (unpaidCount > 0) {
            throw new BusinessValidationException(String.format(
                    "Kỳ lương còn %d nhân viên chưa được ghi nhận thanh toán. Chỉ có thể đóng kỳ lương khi 100%% bảng lương đã thanh toán.",
                    unpaidCount
            ));
        }

        period.setStatus(PayrollPeriodStatus.CLOSED);
        period.setClosedAt(OffsetDateTime.now(VN_ZONE));
        PayrollPeriod saved = periodRepository.save(period);

        return enrichPeriodDto(saved);
    }

    private PayrollPeriodDto enrichPeriodDto(PayrollPeriod p) {
        if (p == null) return null;
        if (p.getStatus() == PayrollPeriodStatus.DRAFT) {
            long empCount = employeeRepository.countByStatus(com.banquethub.modules.employees.entity.EmployeeStatus.ACTIVE);
            return PayrollPeriodDto.fromEntity(p, (int) empCount, BigDecimal.ZERO, 0, 0);
        } else {
            long totalCount = payrollRepository.countByPayrollPeriodId(p.getId());
            BigDecimal totalFinalized = payrollRepository.sumNetSalaryByPeriodId(p.getId());
            long paidCount = payrollRepository.countByPayrollPeriodIdAndPaymentStatus(p.getId(), PaymentStatus.PAID);
            long unpaidCount = payrollRepository.countByPayrollPeriodIdAndPaymentStatus(p.getId(), PaymentStatus.UNPAID);
            return PayrollPeriodDto.fromEntity(p, (int) totalCount, totalFinalized, (int) paidCount, (int) unpaidCount);
        }
    }

    public static String computePreviewHash(List<PayrollPeriodPreviewDto.PayrollPreviewItemDto> items) {
        if (items == null || items.isEmpty()) {
            return "EMPTY";
        }
        List<PayrollPeriodPreviewDto.PayrollPreviewItemDto> sorted = items.stream()
                .sorted(Comparator.comparing(PayrollPeriodPreviewDto.PayrollPreviewItemDto::employeeId))
                .toList();
        StringBuilder sb = new StringBuilder();
        for (PayrollPeriodPreviewDto.PayrollPreviewItemDto it : sorted) {
            sb.append(it.employeeId()).append(':')
              .append(it.actualWorkdays() != null ? it.actualWorkdays().stripTrailingZeros().toPlainString() : "0").append(':')
              .append(it.netSalary() != null ? it.netSalary().stripTrailingZeros().toPlainString() : "0").append(';');
        }
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            return Integer.toHexString(sb.toString().hashCode());
        }
    }
}
