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
                .map(PayrollPeriodDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public PayrollPeriodDto getPayrollPeriodById(Long id) {
        PayrollPeriod period = periodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ lương với ID: " + id));
        return PayrollPeriodDto.fromEntity(period);
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
        return PayrollPeriodDto.fromEntity(saved);
    }

    public PayrollPeriodDto updatePeriod(Long id, UpdatePayrollPeriodRequest request) {
        PayrollPeriod period = periodRepository.findById(id)
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
        return PayrollPeriodDto.fromEntity(saved);
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

            BigDecimal actualWorkdays = empRecords.stream()
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
            if (empRecords.size() < daysInMonth) {
                itemWarnings.add(String.format("Có %d ngày chưa được ghi nhận công trong tháng.", daysInMonth - empRecords.size()));
            }

            if (actualWorkdays.compareTo(period.getStandardWorkdays()) > 0) {
                itemWarnings.add(String.format("Số công thực tế (%.1f) vượt số công chuẩn (%.1f).", actualWorkdays, period.getStandardWorkdays()));
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
                items
        );
    }

    public List<PayrollDto> finalizePeriod(Long periodId, String adminName) {
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
            throw new BusinessValidationException("Không thể chốt bảng lương do có nhân viên có lương thực lĩnh âm hoặc dữ liệu không hợp lệ. Vui lòng rà soát cảnh báo.");
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

        return PayrollPeriodDto.fromEntity(saved);
    }
}
