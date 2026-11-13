package com.banquethub.modules.attendance.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.attendance.dto.*;
import com.banquethub.modules.attendance.entity.Attendance;
import com.banquethub.modules.attendance.entity.AttendanceStatus;
import com.banquethub.modules.attendance.repository.AttendanceRepository;
import com.banquethub.modules.employees.entity.Employee;
import com.banquethub.modules.employees.entity.EmployeeStatus;
import com.banquethub.modules.employees.repository.EmployeeRepository;
import com.banquethub.modules.payroll.entity.PayrollPeriod;
import com.banquethub.modules.payroll.entity.PayrollPeriodStatus;
import com.banquethub.modules.payroll.repository.PayrollPeriodRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final PayrollPeriodRepository payrollPeriodRepository;

    public AttendanceService(
            AttendanceRepository attendanceRepository,
            EmployeeRepository employeeRepository,
            PayrollPeriodRepository payrollPeriodRepository
    ) {
        this.attendanceRepository = attendanceRepository;
        this.employeeRepository = employeeRepository;
        this.payrollPeriodRepository = payrollPeriodRepository;
    }

    @Transactional(readOnly = true)
    public List<AttendanceDto> getAttendanceByMonth(int year, int month, Long employeeId) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        List<Attendance> attendances;
        if (employeeId != null) {
            attendances = attendanceRepository.findByEmployeeIdAndWorkDateBetweenOrderByWorkDateAsc(employeeId, start, end);
        } else {
            attendances = attendanceRepository.findByWorkDateBetweenOrderByWorkDateAsc(start, end);
        }

        return attendances.stream().map(AttendanceDto::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public CompanyAttendanceSummaryDto getMonthlySummary(int year, int month) {
        YearMonth ym = YearMonth.of(year, month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();
        int daysInMonth = ym.lengthOfMonth();

        // 1. Fetch all active employees (and inactive that might have attendance)
        List<Employee> allEmployees = employeeRepository.findAll();
        List<Attendance> monthlyAttendances = attendanceRepository.findByWorkDateBetweenOrderByWorkDateAsc(start, end);

        Map<Long, List<Attendance>> empAttendanceMap = monthlyAttendances.stream()
                .collect(Collectors.groupingBy(a -> a.getEmployee().getId()));

        List<AttendanceMonthlySummaryDto> employeeSummaries = new ArrayList<>();
        BigDecimal totalCompanyWorkUnits = BigDecimal.ZERO;
        int totalRecordedRecords = monthlyAttendances.size();

        for (Employee emp : allEmployees) {
            List<Attendance> empRecords = empAttendanceMap.getOrDefault(emp.getId(), Collections.emptyList());

            // Skip inactive employees if they have 0 attendance records this month
            if (emp.getStatus() == EmployeeStatus.INACTIVE && empRecords.isEmpty()) {
                continue;
            }

            int presentDays = 0;
            int halfDays = 0;
            int absentDays = 0;
            BigDecimal totalUnits = BigDecimal.ZERO;
            Map<Integer, AttendanceDto> dailyRecords = new HashMap<>();

            for (Attendance a : empRecords) {
                dailyRecords.put(a.getWorkDate().getDayOfMonth(), AttendanceDto.fromEntity(a));
                if (a.getAttendanceStatus() == AttendanceStatus.PRESENT) {
                    presentDays++;
                } else if (a.getAttendanceStatus() == AttendanceStatus.HALF_DAY) {
                    halfDays++;
                } else if (a.getAttendanceStatus() == AttendanceStatus.ABSENT) {
                    absentDays++;
                }
                totalUnits = totalUnits.add(a.getWorkUnits());
            }

            int unrecordedDays = daysInMonth - empRecords.size();
            totalCompanyWorkUnits = totalCompanyWorkUnits.add(totalUnits);

            employeeSummaries.add(new AttendanceMonthlySummaryDto(
                    year,
                    month,
                    emp.getId(),
                    emp.getEmployeeCode(),
                    emp.getFullName(),
                    emp.getPosition(),
                    presentDays,
                    halfDays,
                    absentDays,
                    totalUnits,
                    unrecordedDays,
                    dailyRecords
            ));
        }

        employeeSummaries.sort(Comparator.comparing(AttendanceMonthlySummaryDto::employeeId));

        return new CompanyAttendanceSummaryDto(
                year,
                month,
                daysInMonth,
                employeeSummaries.size(),
                totalRecordedRecords,
                totalCompanyWorkUnits,
                employeeSummaries
        );
    }

    public AttendanceDto recordOrUpdateAttendance(Long employeeId, LocalDate workDate, RecordAttendanceRequest request, String adminName) {
        // 1. Check if period for this month is already finalized/closed
        checkPeriodNotFinalized(workDate.getYear(), workDate.getMonthValue());

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + employeeId));

        Attendance attendance = attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, workDate)
                .orElseGet(() -> {
                    Attendance newAtt = new Attendance();
                    newAtt.setEmployee(employee);
                    newAtt.setWorkDate(workDate);
                    newAtt.setCreatedBy(adminName);
                    return newAtt;
                });

        attendance.setAttendanceStatus(request.attendanceStatus());
        attendance.setWorkUnits(request.attendanceStatus().getWorkUnits());
        attendance.setNote(request.note() != null ? request.note().trim() : null);

        Attendance saved = attendanceRepository.save(attendance);
        return AttendanceDto.fromEntity(saved);
    }

    public List<AttendanceDto> recordBulkAttendance(BulkAttendanceRequest request, String adminName) {
        List<AttendanceDto> results = new ArrayList<>();
        for (BulkAttendanceRequest.BulkAttendanceItem item : request.items()) {
            RecordAttendanceRequest singleReq = new RecordAttendanceRequest(item.attendanceStatus(), item.note());
            results.add(recordOrUpdateAttendance(item.employeeId(), item.workDate(), singleReq, adminName));
        }
        return results;
    }

    private void checkPeriodNotFinalized(int year, int month) {
        Optional<PayrollPeriod> periodOpt = payrollPeriodRepository.findByYearAndMonth(year, month);
        if (periodOpt.isPresent()) {
            PayrollPeriod period = periodOpt.get();
            if (period.getStatus() != PayrollPeriodStatus.DRAFT) {
                throw new BusinessValidationException(String.format(
                        "Kỳ lương tháng %d/%d đã ở trạng thái %s. Không thể chỉnh sửa hoặc thêm chấm công.",
                        month, year, period.getStatus()
                ));
            }
        }
    }
}
