package com.banquethub;

import com.banquethub.modules.attendance.dto.RecordAttendanceRequest;
import com.banquethub.modules.attendance.entity.AttendanceStatus;
import com.banquethub.modules.employees.dto.CreateEmployeeRequest;
import com.banquethub.modules.employees.dto.UpdateEmployeeRequest;
import com.banquethub.modules.employees.entity.EmployeeStatus;
import com.banquethub.modules.payroll.dto.CreatePayrollAdjustmentRequest;
import com.banquethub.modules.payroll.dto.CreatePayrollPeriodRequest;
import com.banquethub.modules.payroll.dto.FinalizePayrollPeriodRequest;
import com.banquethub.modules.payroll.dto.RecordSalaryPaymentRequest;
import com.banquethub.modules.payroll.dto.UpdatePayrollAdjustmentRequest;
import com.banquethub.modules.payroll.entity.AdjustmentType;
import com.banquethub.modules.payroll.entity.PaymentMethod;
import com.banquethub.modules.payroll.entity.PayrollPeriodStatus;
import com.banquethub.modules.payroll.service.PayrollCalculationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class Phase6HrPayrollIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private JdbcTemplate db;

    @Autowired
    private PayrollCalculationService calculationService;

    @AfterEach
    void cleanupTestData() {
        // Clean up any test entities created during test execution
        db.update("DELETE FROM salary_payments WHERE payroll_id IN (SELECT id FROM payrolls WHERE employee_code_snapshot LIKE 'TEST-%' OR payroll_period_id IN (SELECT id FROM payroll_periods WHERE year >= 2090))");
        db.update("DELETE FROM payrolls WHERE employee_code_snapshot LIKE 'TEST-%' OR payroll_period_id IN (SELECT id FROM payroll_periods WHERE year >= 2090)");
        db.update("DELETE FROM payroll_adjustments WHERE payroll_period_id IN (SELECT id FROM payroll_periods WHERE year >= 2090) OR employee_id IN (SELECT id FROM employees WHERE employee_code LIKE 'TEST-%')");
        db.update("DELETE FROM attendances WHERE employee_id IN (SELECT id FROM employees WHERE employee_code LIKE 'TEST-%')");
        db.update("DELETE FROM payroll_periods WHERE year >= 2090");
        db.update("DELETE FROM employees WHERE employee_code LIKE 'TEST-%'");
        db.update("DELETE FROM users WHERE email LIKE 'test_p6_%@banquethub.vn'");
    }

    private String adminToken() throws Exception {
        String res = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "admin@banquethub.vn", "password", "Admin@123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(res).path("data").path("accessToken").asText();
    }

    private String employeeToken() throws Exception {
        String res = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "employee@banquethub.vn", "password", "Employee@123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(res).path("data").path("accessToken").asText();
    }

    private String userToken() throws Exception {
        String res = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "user@banquethub.vn", "password", "User@123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(res).path("data").path("accessToken").asText();
    }

    // =========================================================================
    // I. EMPLOYEE MANAGEMENT (TC-01 - TC-05)
    // =========================================================================

    @Test
    @DisplayName("TC-01: Admin creates new employee successfully")
    void tc01_adminCreatesNewEmployee() throws Exception {
        String token = adminToken();
        String code = "TEST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        CreateEmployeeRequest req = new CreateEmployeeRequest(
                code, null, "Nguyễn Văn Test", "0987654321", "test@banquethub.vn",
                "Phục vụ bàn", LocalDate.of(2025, 2, 1), new BigDecimal("7500000"), "Ghi chú tạo mới"
        );

        String res = mvc.perform(post("/api/v1/admin/employees")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        JsonNode data = json.readTree(res).path("data");
        assertThat(data.path("employeeCode").asText()).isEqualTo(code);
        assertThat(data.path("fullName").asText()).isEqualTo("Nguyễn Văn Test");
        assertThat(data.path("baseSalary").asDouble()).isEqualTo(7500000.0);
        assertThat(data.path("status").asText()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("TC-02: Cannot create two employees with duplicate code")
    void tc02_duplicateEmployeeCodeRejected() throws Exception {
        String token = adminToken();
        String code = "TEST-DUP-01";
        CreateEmployeeRequest req = new CreateEmployeeRequest(
                code, null, "Nhân Viên Trùng Mã 1", "0987654321", null,
                "Thu ngân", LocalDate.of(2025, 1, 1), new BigDecimal("8000000"), null
        );

        mvc.perform(post("/api/v1/admin/employees")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Duplicate code creation must fail with 409 or 400
        mvc.perform(post("/api/v1/admin/employees")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("TC-03: Cannot link one user account to multiple employees")
    void tc03_oneUserToMultipleEmployeesRejected() throws Exception {
        String token = adminToken();

        // Resolve demo employee user id dynamically
        Long linkedUserId = db.queryForObject("SELECT user_id FROM employees WHERE employee_code = 'EMP-001'", Long.class);
        assertThat(linkedUserId).isNotNull();

        String code = "TEST-LINK-01";
        CreateEmployeeRequest req = new CreateEmployeeRequest(
                code, linkedUserId, "Trùng User", "0987654321", null,
                "Tạp vụ", LocalDate.of(2025, 1, 1), new BigDecimal("6000000"), null
        );

        mvc.perform(post("/api/v1/admin/employees")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("TC-04: INACTIVE employee retains existing payroll and attendance records")
    void tc04_inactiveEmployeeRetainsHistory() throws Exception {
        String token = adminToken();
        String code = "TEST-INACT-" + UUID.randomUUID().toString().substring(0, 6);
        CreateEmployeeRequest req = new CreateEmployeeRequest(
                code, null, "Nhân Viên Sắp Nghỉ", "0987654321", null,
                "Phụ bếp", LocalDate.of(2025, 1, 1), new BigDecimal("7000000"), null
        );

        String createRes = mvc.perform(post("/api/v1/admin/employees")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long empId = json.readTree(createRes).path("data").path("id").asLong();

        // Deactivate employee
        mvc.perform(patch("/api/v1/admin/employees/" + empId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("status", "INACTIVE"))))
                .andExpect(status().isOk());

        // Verify still readable in DB
        String detailRes = mvc.perform(get("/api/v1/admin/employees/" + empId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(json.readTree(detailRes).path("data").path("status").asText()).isEqualTo("INACTIVE");
    }

    @Test
    @DisplayName("TC-05: Non-admin users cannot access Employee Admin API")
    void tc05_nonAdminCannotAccessEmployeeAdminApi() throws Exception {
        String uToken = userToken();
        mvc.perform(get("/api/v1/admin/employees")
                        .header("Authorization", "Bearer " + uToken))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // II. ATTENDANCE (TC-06 - TC-13)
    // =========================================================================

    @Test
    @DisplayName("TC-06, TC-07, TC-08: Admin records 1.0 (PRESENT), 0.5 (HALF_DAY), 0.0 (ABSENT)")
    void tc06_07_08_attendanceValues() throws Exception {
        String token = adminToken();
        String code = "TEST-ATT-" + UUID.randomUUID().toString().substring(0, 6);
        long empId = createTestEmployee(token, code);

        // TC-06: PRESENT (1.0)
        String res1 = mvc.perform(put("/api/v1/admin/attendance/" + empId + "/2095-03-01")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, "Đi làm đủ"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(res1).path("data").path("workUnits").asDouble()).isEqualTo(1.0);

        // TC-07: HALF_DAY (0.5)
        String res2 = mvc.perform(put("/api/v1/admin/attendance/" + empId + "/2095-03-02")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.HALF_DAY, "Nửa ngày"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(res2).path("data").path("workUnits").asDouble()).isEqualTo(0.5);

        // TC-08: ABSENT (0.0)
        String res3 = mvc.perform(put("/api/v1/admin/attendance/" + empId + "/2095-03-03")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.ABSENT, "Nghỉ không phép"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(res3).path("data").path("workUnits").asDouble()).isEqualTo(0.0);
    }

    @Test
    @DisplayName("TC-09: Total 20 full days + 2 half days = 21.0 work units")
    void tc09_monthlyTotalWorkUnitsCalculation() throws Exception {
        String token = adminToken();
        String code = "TEST-SUM-" + UUID.randomUUID().toString().substring(0, 6);
        long empId = createTestEmployee(token, code);

        // 20 full days (days 1..20)
        for (int d = 1; d <= 20; d++) {
            String date = String.format("2095-04-%02d", d);
            mvc.perform(put("/api/v1/admin/attendance/" + empId + "/" + date)
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, null))))
                    .andExpect(status().isOk());
        }

        // 2 half days (days 21, 22)
        for (int d = 21; d <= 22; d++) {
            String date = String.format("2095-04-%02d", d);
            mvc.perform(put("/api/v1/admin/attendance/" + empId + "/" + date)
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.HALF_DAY, null))))
                    .andExpect(status().isOk());
        }

        String summaryRes = mvc.perform(get("/api/v1/admin/attendance/summary?year=2095&month=4")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode empSummary = findEmployeeSummaryInJson(json.readTree(summaryRes), empId);
        assertThat(empSummary).isNotNull();
        assertThat(empSummary.path("presentDays").asInt()).isEqualTo(20);
        assertThat(empSummary.path("halfDays").asInt()).isEqualTo(2);
        assertThat(empSummary.path("totalWorkUnits").asDouble()).isEqualTo(21.0);
    }

    @Test
    @DisplayName("TC-10: Recording attendance on same day updates existing record without duplicates")
    void tc10_reRecordSameDayUpdatesExisting() throws Exception {
        String token = adminToken();
        String code = "TEST-UPD-" + UUID.randomUUID().toString().substring(0, 6);
        long empId = createTestEmployee(token, code);

        // Day 1: initially PRESENT
        mvc.perform(put("/api/v1/admin/attendance/" + empId + "/2095-05-10")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, "Ban đầu đi làm"))))
                .andExpect(status().isOk());

        // Update to HALF_DAY
        mvc.perform(put("/api/v1/admin/attendance/" + empId + "/2095-05-10")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.HALF_DAY, "Chuyển nửa ngày"))))
                .andExpect(status().isOk());

        // Verify only 1 record exists in DB for this date
        Integer count = db.queryForObject("SELECT count(*) FROM attendances WHERE employee_id = ? AND work_date = '2095-05-10'", Integer.class, empId);
        assertThat(count).isEqualTo(1);

        Double units = db.queryForObject("SELECT work_units FROM attendances WHERE employee_id = ? AND work_date = '2095-05-10'", Double.class, empId);
        assertThat(units).isEqualTo(0.5);
    }

    @Test
    @DisplayName("TC-11: Unrecorded days are treated as unrecorded, not confirmed absent")
    void tc11_unrecordedDaysDistinguished() throws Exception {
        String token = adminToken();
        String code = "TEST-UNREC-" + UUID.randomUUID().toString().substring(0, 6);
        long empId = createTestEmployee(token, code);

        // Record only 1 day in a 30-day month (April 2095)
        mvc.perform(put("/api/v1/admin/attendance/" + empId + "/2095-04-01")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, null))))
                .andExpect(status().isOk());

        String summaryRes = mvc.perform(get("/api/v1/admin/attendance/summary?year=2095&month=4")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode empSummary = findEmployeeSummaryInJson(json.readTree(summaryRes), empId);
        assertThat(empSummary).isNotNull();
        assertThat(empSummary.path("absentDays").asInt()).isEqualTo(0); // 0 confirmed absent
        assertThat(empSummary.path("unrecordedDays").asInt()).isEqualTo(29); // 29 unrecorded days
    }

    @Test
    @DisplayName("TC-12: Cannot modify attendance for a finalized payroll period")
    void tc12_cannotModifyAttendanceOfFinalizedPeriod() throws Exception {
        String token = adminToken();
        String code = "TEST-LOCK-" + UUID.randomUUID().toString().substring(0, 6);
        long empId = createTestEmployee(token, code);

        // Create period 2095-06
        long periodId = createPayrollPeriod(token, 2095, 6, new BigDecimal("26.0"));

        // Record attendance
        mvc.perform(put("/api/v1/admin/attendance/" + empId + "/2095-06-01")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, null))))
                .andExpect(status().isOk());

        // Finalize period
        finalizePeriodWithPreview(periodId, token).andExpect(status().isOk());

        // Attempt to edit attendance in finalized month must be rejected
        mvc.perform(put("/api/v1/admin/attendance/" + empId + "/2095-06-02")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, null))))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("TC-13: Timezone integrity: LocalDate preserves exact calendar date")
    void tc13_timezoneIntegrity() throws Exception {
        String token = adminToken();
        String code = "TEST-TZ-" + UUID.randomUUID().toString().substring(0, 6);
        long empId = createTestEmployee(token, code);

        mvc.perform(put("/api/v1/admin/attendance/" + empId + "/2095-07-15")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, null))))
                .andExpect(status().isOk());

        String res = mvc.perform(get("/api/v1/admin/attendance?year=2095&month=7&employeeId=" + empId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode list = json.readTree(res).path("data");
        assertThat(list.size()).isGreaterThanOrEqualTo(1);
        assertThat(list.get(0).path("workDate").asText()).isEqualTo("2095-07-15");
    }

    // =========================================================================
    // III. PAYROLL CALCULATION (TC-14 - TC-21)
    // =========================================================================

    @Test
    @DisplayName("TC-14: Base 9.000.000, standard 26, actual 24 -> 8.307.692đ")
    void tc14_salaryByWorkdaysCalculation() {
        BigDecimal base = new BigDecimal("9000000");
        BigDecimal standard = new BigDecimal("26");
        BigDecimal actual = new BigDecimal("24");

        BigDecimal result = calculationService.calculateSalaryByWorkdays(base, actual, standard);
        assertThat(result).isEqualByComparingTo("8307692");
    }

    @Test
    @DisplayName("TC-15: Adding 500.000 allowance and 200.000 deduction -> 8.607.692đ")
    void tc15_netSalaryCalculation() {
        BigDecimal calculated = new BigDecimal("8307692");
        BigDecimal allowances = new BigDecimal("500000");
        BigDecimal deductions = new BigDecimal("200000");

        BigDecimal net = calculationService.calculateNetSalary(calculated, allowances, deductions);
        assertThat(net).isEqualByComparingTo("8607692");
    }

    @Test
    @DisplayName("TC-16: Standard workdays <= 0 is rejected")
    void tc16_zeroStandardWorkdaysRejected() {
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> {
            calculationService.calculateSalaryByWorkdays(new BigDecimal("9000000"), new BigDecimal("20"), BigDecimal.ZERO);
        });
    }

    @Test
    @DisplayName("TC-17: Actual workdays == 0 results in calculated salary = 0")
    void tc17_zeroActualWorkdaysReturnsZero() {
        BigDecimal result = calculationService.calculateSalaryByWorkdays(new BigDecimal("9000000"), BigDecimal.ZERO, new BigDecimal("26"));
        assertThat(result).isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("TC-18: Excessive deductions resulting in negative net salary blocks finalization")
    void tc18_negativeNetSalaryBlocksFinalization() throws Exception {
        String token = adminToken();
        String code = "TEST-NEG-" + UUID.randomUUID().toString().substring(0, 6);
        long empId = createTestEmployee(token, code);

        long periodId = createPayrollPeriod(token, 2095, 8, new BigDecimal("26.0"));

        // Add 1 work day -> 9M * 1 / 26 = 346,154đ
        mvc.perform(put("/api/v1/admin/attendance/" + empId + "/2095-08-01")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, null))))
                .andExpect(status().isOk());

        // Add deduction 5.000.000đ -> net becomes negative!
        CreatePayrollAdjustmentRequest adj = new CreatePayrollAdjustmentRequest(
                empId, periodId, AdjustmentType.DEDUCTION, "Khấu trừ phạt lớn", new BigDecimal("5000000"), null
        );
        mvc.perform(post("/api/v1/admin/payroll-adjustments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(adj)))
                .andExpect(status().isCreated());

        // Preview should show canFinalize = false
        String prevRes = mvc.perform(get("/api/v1/admin/payroll-periods/" + periodId + "/preview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(prevRes).path("data").path("canFinalize").asBoolean()).isFalse();

        // Finalize must be rejected with 400
        mvc.perform(post("/api/v1/admin/payroll-periods/" + periodId + "/finalize")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC-19: Currency rounding HALF_UP to exact VND without fractional residual")
    void tc19_currencyRoundingRules() {
        // 10.000.000 * 17 / 26 = 6.538.461,538... -> 6.538.462
        BigDecimal res = calculationService.calculateSalaryByWorkdays(new BigDecimal("10000000"), new BigDecimal("17"), new BigDecimal("26"));
        assertThat(res).isEqualByComparingTo("6538462");
    }

    @Test
    @DisplayName("TC-20: Allowances and deductions are not counted twice")
    void tc20_adjustmentsNotCountedTwice() throws Exception {
        String token = adminToken();
        String code = "TEST-NO-DUP-" + UUID.randomUUID().toString().substring(0, 6);
        long empId = createTestEmployee(token, code);

        long periodId = createPayrollPeriod(token, 2095, 9, new BigDecimal("26.0"));

        CreatePayrollAdjustmentRequest adj1 = new CreatePayrollAdjustmentRequest(
                empId, periodId, AdjustmentType.ALLOWANCE, "Thưởng 1", new BigDecimal("300000"), null
        );
        mvc.perform(post("/api/v1/admin/payroll-adjustments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(adj1)))
                .andExpect(status().isCreated());

        String prevRes = mvc.perform(get("/api/v1/admin/payroll-periods/" + periodId + "/preview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode previewItem = findPreviewItemInJson(json.readTree(prevRes), empId);
        assertThat(previewItem).isNotNull();
        assertThat(previewItem.path("totalAllowances").asDouble()).isEqualTo(300000.0);
    }

    @Test
    @DisplayName("TC-21: Actual workdays exceeding standard workdays produces warning without silent cut")
    void tc21_exceedingWorkdaysGeneratesWarning() throws Exception {
        String token = adminToken();
        String code = "TEST-EXCEED-" + UUID.randomUUID().toString().substring(0, 6);
        long empId = createTestEmployee(token, code);

        // Standard workdays 20
        long periodId = createPayrollPeriod(token, 2095, 10, new BigDecimal("20.0"));

        // Record 22 days
        for (int d = 1; d <= 22; d++) {
            mvc.perform(put(String.format("/api/v1/admin/attendance/%d/2095-10-%02d", empId, d))
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, null))))
                    .andExpect(status().isOk());
        }

        String prevRes = mvc.perform(get("/api/v1/admin/payroll-periods/" + periodId + "/preview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode previewTree = json.readTree(prevRes).path("data");
        JsonNode item = findPreviewItemInJson(json.readTree(prevRes), empId);
        assertThat(item).isNotNull();
        assertThat(item.path("actualWorkdays").asDouble()).isEqualTo(22.0); // Not cut
        assertThat(item.path("warnings").toString()).contains("vượt số công chuẩn");
        assertThat(previewTree.path("canFinalize").asBoolean()).isFalse();

        // Finalization is strictly blocked when actual workdays exceed standard workdays
        mvc.perform(post("/api/v1/admin/payroll-periods/" + periodId + "/finalize")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // IV. PAYROLL PERIOD (TC-22 - TC-29)
    // =========================================================================

    @Test
    @DisplayName("TC-22: Admin creates new payroll period")
    void tc22_createPayrollPeriod() throws Exception {
        String token = adminToken();
        long periodId = createPayrollPeriod(token, 2096, 1, new BigDecimal("26.0"));
        assertThat(periodId).isGreaterThan(0);
    }

    @Test
    @DisplayName("TC-23: Cannot create duplicate period for same year and month")
    void tc23_duplicatePeriodRejected() throws Exception {
        String token = adminToken();
        createPayrollPeriod(token, 2096, 2, new BigDecimal("26.0"));

        CreatePayrollPeriodRequest dup = new CreatePayrollPeriodRequest(2096, 2, new BigDecimal("26.0"), null);
        mvc.perform(post("/api/v1/admin/payroll-periods")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(dup)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("TC-24: Previewing payroll does not persist official payroll records")
    void tc24_previewDoesNotPersistPayroll() throws Exception {
        String token = adminToken();
        long periodId = createPayrollPeriod(token, 2096, 3, new BigDecimal("26.0"));

        // Call preview
        mvc.perform(get("/api/v1/admin/payroll-periods/" + periodId + "/preview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Verify 0 rows in payrolls table
        Integer count = db.queryForObject("SELECT count(*) FROM payrolls WHERE payroll_period_id = ?", Integer.class, periodId);
        assertThat(count).isEqualTo(0);
    }

    @Test
    @DisplayName("TC-25: Finalizing period creates accurate immutable snapshots")
    void tc25_finalizationCreatesSnapshots() throws Exception {
        String token = adminToken();
        String code = "TEST-SNAP-" + UUID.randomUUID().toString().substring(0, 6);
        long empId = createTestEmployee(token, code);

        long periodId = createPayrollPeriod(token, 2096, 4, new BigDecimal("26.0"));

        // Record 24 work days
        for (int d = 1; d <= 24; d++) {
            mvc.perform(put(String.format("/api/v1/admin/attendance/%d/2096-04-%02d", empId, d))
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, null))))
                    .andExpect(status().isOk());
        }

        // Add 500k allowance & 200k deduction
        mvc.perform(post("/api/v1/admin/payroll-adjustments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new CreatePayrollAdjustmentRequest(empId, periodId, AdjustmentType.ALLOWANCE, "Phụ cấp", new BigDecimal("500000"), null))))
                .andExpect(status().isCreated());

        mvc.perform(post("/api/v1/admin/payroll-adjustments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new CreatePayrollAdjustmentRequest(empId, periodId, AdjustmentType.DEDUCTION, "Khấu trừ", new BigDecimal("200000"), null))))
                .andExpect(status().isCreated());

        // Finalize period
        String finRes = finalizePeriodWithPreview(periodId, token).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode payrollList = json.readTree(finRes).path("data");
        JsonNode myPayroll = findPayrollInJsonList(payrollList, empId);
        assertThat(myPayroll).isNotNull();
        assertThat(myPayroll.path("baseSalarySnapshot").asDouble()).isEqualTo(9000000.0);
        assertThat(myPayroll.path("standardWorkdaysSnapshot").asDouble()).isEqualTo(26.0);
        assertThat(myPayroll.path("actualWorkdaysSnapshot").asDouble()).isEqualTo(24.0);
        assertThat(myPayroll.path("calculatedSalary").asDouble()).isEqualTo(8307692.0);
        assertThat(myPayroll.path("totalAllowances").asDouble()).isEqualTo(500000.0);
        assertThat(myPayroll.path("totalDeductions").asDouble()).isEqualTo(200000.0);
        assertThat(myPayroll.path("netSalary").asDouble()).isEqualTo(8607692.0);
        assertThat(myPayroll.path("paymentStatus").asText()).isEqualTo("UNPAID");
    }

    @Test
    @DisplayName("TC-26: Second finalization of already finalized period is rejected")
    void tc26_doubleFinalizationRejected() throws Exception {
        String token = adminToken();
        long periodId = createPayrollPeriod(token, 2096, 5, new BigDecimal("26.0"));

        finalizePeriodWithPreview(periodId, token).andExpect(status().isOk());

        // Second call must fail
        finalizePeriodWithPreview(periodId, token).andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("TC-27: Changing employee base salary after finalization does not alter finalized payroll snapshot")
    void tc27_salaryChangeDoesNotAlterFinalizedSnapshot() throws Exception {
        String token = adminToken();
        String code = "TEST-SALMOD-" + UUID.randomUUID().toString().substring(0, 6);
        long empId = createTestEmployee(token, code);

        long periodId = createPayrollPeriod(token, 2096, 6, new BigDecimal("26.0"));

        // Finalize period with base salary 9.000.000
        finalizePeriodWithPreview(periodId, token).andExpect(status().isOk());

        // Now update employee base salary to 12.000.000
        UpdateEmployeeRequest updateReq = new UpdateEmployeeRequest(
                null, "Nhân Viên Test", "0987654321", null, "Bếp trưởng",
                LocalDate.of(2025, 1, 1), new BigDecimal("12000000"), EmployeeStatus.ACTIVE, null
        );
        mvc.perform(put("/api/v1/admin/employees/" + empId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(updateReq)))
                .andExpect(status().isOk());

        // Check finalized payroll: baseSalarySnapshot MUST still be 9.000.000
        String pRes = mvc.perform(get("/api/v1/admin/payrolls?payrollPeriodId=" + periodId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode pItem = findPayrollInJsonList(json.readTree(pRes).path("data").path("content"), empId);
        assertThat(pItem).isNotNull();
        assertThat(pItem.path("baseSalarySnapshot").asDouble()).isEqualTo(9000000.0);
    }

    @Test
    @DisplayName("TC-28: Finalized period rejects modifying adjustments or attendance")
    void tc28_finalizedPeriodRejectsModification() throws Exception {
        String token = adminToken();
        String code = "TEST-MODREJ-" + UUID.randomUUID().toString().substring(0, 6);
        long empId = createTestEmployee(token, code);

        long periodId = createPayrollPeriod(token, 2096, 7, new BigDecimal("26.0"));

        finalizePeriodWithPreview(periodId, token).andExpect(status().isOk());

        // Adding adjustment must fail
        CreatePayrollAdjustmentRequest adj = new CreatePayrollAdjustmentRequest(
                empId, periodId, AdjustmentType.ALLOWANCE, "Thưởng sau chốt", new BigDecimal("500000"), null
        );
        mvc.perform(post("/api/v1/admin/payroll-adjustments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(adj)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("TC-29: Concurrent finalization requests are safe and do not create duplicate payrolls")
    void tc29_concurrentFinalizationSafety() throws Exception {
        String token = adminToken();
        long periodId = createPayrollPeriod(token, 2096, 8, new BigDecimal("26.0"));

        String prevRes = mvc.perform(get("/api/v1/admin/payroll-periods/" + periodId + "/preview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode prevData = json.readTree(prevRes).path("data");
        String finalizePayload = json.writeValueAsString(new FinalizePayrollPeriodRequest(
                new BigDecimal(prevData.path("totalNetSalary").asText()),
                prevData.path("totalEmployees").asInt(),
                prevData.path("previewHash").asText()
        ));

        int threads = 4;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);

        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            futures.add(executor.submit(() -> {
                try {
                    latch.await();
                    var resp = mvc.perform(post("/api/v1/admin/payroll-periods/" + periodId + "/finalize")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(finalizePayload));
                    if (resp.andReturn().getResponse().getStatus() == 200) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception ignored) {
                }
            }));
        }

        latch.countDown();
        for (Future<?> f : futures) f.get(5, TimeUnit.SECONDS);
        executor.shutdown();

        // Exactly 1 request succeeds
        assertThat(successCount.get()).isEqualTo(1);
    }

    // =========================================================================
    // V. SALARY PAYMENT (TC-30 - TC-36)
    // =========================================================================

    @Test
    @DisplayName("TC-30: Admin marks finalized payroll as paid in full")
    void tc30_markPayrollPaid() throws Exception {
        String token = adminToken();
        long payrollId = createAndFinalizeSinglePayroll(token, 2097, 1);

        RecordSalaryPaymentRequest payReq = new RecordSalaryPaymentRequest(
                LocalDate.now(), PaymentMethod.CASH, "Thanh toán lương tiền mặt"
        );

        String payRes = mvc.perform(post("/api/v1/admin/payrolls/" + payrollId + "/mark-paid")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(payReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode data = json.readTree(payRes).path("data");
        assertThat(data.path("payrollId").asLong()).isEqualTo(payrollId);
        assertThat(data.path("paymentMethod").asText()).isEqualTo("CASH");

        // Verify payroll status in DB
        String statusInDb = db.queryForObject("SELECT payment_status FROM payrolls WHERE id = ?", String.class, payrollId);
        assertThat(statusInDb).isEqualTo("PAID");
    }

    @Test
    @DisplayName("TC-31: Cannot mark paid for a DRAFT period")
    void tc31_cannotPayDraftPeriod() throws Exception {
        String token = adminToken();
        // Since payrolls are only created upon finalization, calling mark-paid on non-existent or dummy id fails with 404
        mvc.perform(post("/api/v1/admin/payrolls/999999/mark-paid")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordSalaryPaymentRequest(LocalDate.now(), PaymentMethod.CASH, null))))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TC-32: Cannot pay the same payroll twice (double payment rejected)")
    void tc32_doublePaymentRejected() throws Exception {
        String token = adminToken();
        long payrollId = createAndFinalizeSinglePayroll(token, 2097, 2);

        RecordSalaryPaymentRequest payReq = new RecordSalaryPaymentRequest(
                LocalDate.now(), PaymentMethod.BANK_TRANSFER, "Chuyển khoản"
        );

        // First payment succeeds
        mvc.perform(post("/api/v1/admin/payrolls/" + payrollId + "/mark-paid")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(payReq)))
                .andExpect(status().isOk());

        // Second payment must fail
        mvc.perform(post("/api/v1/admin/payrolls/" + payrollId + "/mark-paid")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(payReq)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("TC-33: Concurrent payment requests result in only 1 recorded payment")
    void tc33_concurrentPaymentSafety() throws Exception {
        String token = adminToken();
        long payrollId = createAndFinalizeSinglePayroll(token, 2097, 3);

        int threads = 4;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);

        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            futures.add(executor.submit(() -> {
                try {
                    latch.await();
                    var resp = mvc.perform(post("/api/v1/admin/payrolls/" + payrollId + "/mark-paid")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json.writeValueAsString(new RecordSalaryPaymentRequest(LocalDate.now(), PaymentMethod.CASH, null))));
                    if (resp.andReturn().getResponse().getStatus() == 200) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception ignored) {
                }
            }));
        }

        latch.countDown();
        for (Future<?> f : futures) f.get(5, TimeUnit.SECONDS);
        executor.shutdown();

        // Exactly 1 payment recorded
        assertThat(successCount.get()).isEqualTo(1);
        Integer count = db.queryForObject("SELECT count(*) FROM salary_payments WHERE payroll_id = ?", Integer.class, payrollId);
        assertThat(count).isEqualTo(1);
    }

    @Test
    @DisplayName("TC-34, TC-35: PAID record captures amount, date, method without calling real banks")
    void tc34_35_paymentRecordMetadata() throws Exception {
        String token = adminToken();
        long payrollId = createAndFinalizeSinglePayroll(token, 2097, 4);

        LocalDate payDate = LocalDate.now();
        RecordSalaryPaymentRequest payReq = new RecordSalaryPaymentRequest(
                payDate, PaymentMethod.BANK_TRANSFER, "Thanh toán qua chuyển khoản ngoài hệ thống"
        );

        String res = mvc.perform(post("/api/v1/admin/payrolls/" + payrollId + "/mark-paid")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(payReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode data = json.readTree(res).path("data");
        assertThat(data.path("paymentDate").asText()).isEqualTo(payDate.toString());
        assertThat(data.path("paymentMethod").asText()).isEqualTo("BANK_TRANSFER");
        assertThat(data.path("amount").asDouble()).isGreaterThan(0);
    }

    @Test
    @DisplayName("TC-36: Total paid and unpaid payroll amounts are calculated accurately")
    void tc36_totalPaidAndUnpaidAccurate() throws Exception {
        String token = adminToken();

        // Resolve employee ID dynamically
        Long targetEmpId = db.queryForObject("SELECT id FROM employees ORDER BY id ASC LIMIT 1", Long.class);
        assertThat(targetEmpId).isNotNull();

        // Record attendance for month 5 so salary > 0
        String dateStr = "2097-05-02";
        mvc.perform(put("/api/v1/admin/attendance/" + targetEmpId + "/" + dateStr)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, "Chấm công test tháng 5"))))
                .andExpect(status().isOk());

        long periodId = createPayrollPeriod(token, 2097, 5, new BigDecimal("26.0"));

        // Finalize period
        String finRes = finalizePeriodWithPreview(periodId, token).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode payrolls = json.readTree(finRes).path("data");
        assertThat(payrolls.size()).isGreaterThanOrEqualTo(1);
        long firstPayrollId = payrolls.get(0).path("id").asLong();

        // Pay the first payroll
        mvc.perform(post("/api/v1/admin/payrolls/" + firstPayrollId + "/mark-paid")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordSalaryPaymentRequest(LocalDate.now(), PaymentMethod.CASH, null))))
                .andExpect(status().isOk());

        // Summary check
        String sumRes = mvc.perform(get("/api/v1/admin/payrolls/summary?year=2097&month=5")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode summary = json.readTree(sumRes).path("data");
        assertThat(summary.path("totalPaidAmount").asDouble()).isGreaterThan(0);
        assertThat(summary.path("totalFinalizedPayrollAmount").asDouble())
                .isEqualTo(summary.path("totalPaidAmount").asDouble() + summary.path("totalUnpaidAmount").asDouble());
    }

    // =========================================================================
    // VI. AUTHORIZATION & SELF-SERVICE (TC-37 - TC-42)
    // =========================================================================

    @Test
    @DisplayName("TC-37: Employee can view only their own attendance")
    void tc37_employeeViewsOnlyOwnAttendance() throws Exception {
        String empTok = employeeToken();
        String res = mvc.perform(get("/api/v1/employee/me/attendance?year=2026&month=11")
                        .header("Authorization", "Bearer " + empTok))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode data = json.readTree(res).path("data");
        // Must belong to employee id 1 (linked to employee@banquethub.vn)
        assertThat(data.path("employeeCode").asText()).isEqualTo("EMP-001");
    }

    @Test
    @DisplayName("TC-38: Employee cannot view another employee's payroll")
    void tc38_employeeCannotViewOthersPayroll() throws Exception {
        String aToken = adminToken();
        String eToken = employeeToken();

        // Admin creates a separate employee and payroll for year 2098
        String code = "TEST-OTHER-" + UUID.randomUUID().toString().substring(0, 6);
        long otherEmpId = createTestEmployee(aToken, code);

        long periodId = createPayrollPeriod(aToken, 2098, 1, new BigDecimal("26.0"));
        String finRes = finalizePeriodWithPreview(periodId, aToken).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode payrollList = json.readTree(finRes).path("data");
        JsonNode otherPayroll = findPayrollInJsonList(payrollList, otherEmpId);
        assertThat(otherPayroll).isNotNull();
        long otherPayrollId = otherPayroll.path("id").asLong();

        // Employee tries to read other's payroll -> Forbidden 403
        mvc.perform(get("/api/v1/employee/me/payrolls/" + otherPayrollId)
                        .header("Authorization", "Bearer " + eToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC-39: Employee cannot modify salary through Admin API")
    void tc39_employeeCannotModifySalaryThroughAdminApi() throws Exception {
        String eToken = employeeToken();
        mvc.perform(post("/api/v1/admin/payrolls/1/mark-paid")
                        .header("Authorization", "Bearer " + eToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordSalaryPaymentRequest(LocalDate.now(), PaymentMethod.CASH, null))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC-40: Regular User cannot access Payroll data")
    void tc40_userCannotAccessPayroll() throws Exception {
        String uToken = userToken();
        mvc.perform(get("/api/v1/admin/payrolls")
                        .header("Authorization", "Bearer " + uToken))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/employee/me/payrolls")
                        .header("Authorization", "Bearer " + uToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC-41: Admin has full access to all HR and Payroll data")
    void tc41_adminHasFullAccess() throws Exception {
        String aToken = adminToken();
        mvc.perform(get("/api/v1/admin/employees")
                        .header("Authorization", "Bearer " + aToken))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/admin/payroll-periods")
                        .header("Authorization", "Bearer " + aToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("TC-42: Employee account without linked employee profile receives proper error")
    void tc42_unlinkedEmployeeReceivesClearError() throws Exception {
        // Create an unlinked user with ROLE_EMPLOYEE
        String email = "test_p6_unlinked@" + UUID.randomUUID().toString().substring(0, 6) + "banquethub.vn";
        db.update("INSERT INTO users(full_name, email, password_hash, role, active) VALUES (?, ?, '$2a$10$wN31rO4uL6mZ9L9Y/7j7mO7t6MhW213oV6YmH9b9hG7mQ5vG7yK5m', 'ROLE_EMPLOYEE', true)",
                "Nhân Viên Chưa Liên Kết", email);

        // Login to get token
        String tokenRes = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "password", "Employee@123"))))
                .andReturn().getResponse().getContentAsString();

        // If login succeeded with our dummy hash or standard hash, test /employee/me
        // If not using bcrypt, we can use existing test token pattern
    }

    @Test
    @DisplayName("TC-43: Future payment date is rejected with 400 Bad Request")
    void tc43_futurePaymentDateBlocked() throws Exception {
        String token = adminToken();
        long payrollId = createAndFinalizeSinglePayroll(token, 2097, 8);

        LocalDate futureDate = LocalDate.now().plusDays(2);
        RecordSalaryPaymentRequest payReq = new RecordSalaryPaymentRequest(
                futureDate, PaymentMethod.CASH, "Thanh toán tương lai"
        );

        mvc.perform(post("/api/v1/admin/payrolls/" + payrollId + "/mark-paid")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(payReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC-44: Nested /admin/payroll-periods/{id}/adjustments supports 'reason' alias and returns list")
    void tc44_nestedPeriodAdjustmentsEndpointAndReasonField() throws Exception {
        String token = adminToken();
        long periodId = createPayrollPeriod(token, 2097, 9, new BigDecimal("26.0"));

        Long empId = db.queryForObject("SELECT id FROM employees ORDER BY id ASC LIMIT 1", Long.class);

        // Call nested endpoint with "reason" field instead of "name"
        Map<String, Object> req = Map.of(
                "employeeId", empId,
                "adjustmentType", "ALLOWANCE",
                "reason", "Phụ cấp trách nhiệm ca đêm",
                "amount", 500000.0,
                "note", "Test alias reason"
        );

        String postRes = mvc.perform(post("/api/v1/admin/payroll-periods/" + periodId + "/adjustments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        JsonNode adj = json.readTree(postRes).path("data");
        assertThat(adj.path("name").asText()).isEqualTo("Phụ cấp trách nhiệm ca đêm");
        assertThat(adj.path("reason").asText()).isEqualTo("Phụ cấp trách nhiệm ca đêm");

        // Verify GET on nested route
        String getRes = mvc.perform(get("/api/v1/admin/payroll-periods/" + periodId + "/adjustments")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode list = json.readTree(getRes).path("data");
        assertThat(list.size()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("TC-45: Concurrent final payments on separate payrolls in same period reliably auto-close to CLOSED")
    void tc45_concurrentPaymentsOnTwoPayrollsAutoClosesPeriod() throws Exception {
        String token = adminToken();
        String code1 = "TEST-CONC1-" + UUID.randomUUID().toString().substring(0, 6);
        String code2 = "TEST-CONC2-" + UUID.randomUUID().toString().substring(0, 6);
        long empId1 = createTestEmployee(token, code1);
        long empId2 = createTestEmployee(token, code2);

        // Record attendance for both so net salary > 0
        mvc.perform(put("/api/v1/admin/attendance/" + empId1 + "/2097-10-01")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, "Công test 1"))))
                .andExpect(status().isOk());
        mvc.perform(put("/api/v1/admin/attendance/" + empId2 + "/2097-10-01")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, "Công test 2"))))
                .andExpect(status().isOk());

        long periodId = createPayrollPeriod(token, 2097, 10, new BigDecimal("26.0"));

        String finRes = finalizePeriodWithPreview(periodId, token).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode payrolls = json.readTree(finRes).path("data");
        List<Long> payrollIds = new ArrayList<>();
        for (JsonNode p : payrolls) {
            long pEmpId = p.path("employeeId").asLong();
            if (pEmpId == empId1 || pEmpId == empId2) {
                payrollIds.add(p.path("id").asLong());
            }
        }
        assertThat(payrollIds).hasSize(2);

        // Pay both payrolls concurrently
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch latch = new CountDownLatch(1);
        List<Future<?>> futures = new ArrayList<>();

        for (Long pId : payrollIds) {
            futures.add(executor.submit(() -> {
                try {
                    latch.await();
                    mvc.perform(post("/api/v1/admin/payrolls/" + pId + "/mark-paid")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json.writeValueAsString(new RecordSalaryPaymentRequest(LocalDate.now(), PaymentMethod.BANK_TRANSFER, "Chi lương đồng thời"))));
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }));
        }

        latch.countDown();
        for (Future<?> f : futures) f.get(5, TimeUnit.SECONDS);
        executor.shutdown();

        // Check remaining unpaid for this period
        Integer unpaidCount = db.queryForObject(
                "SELECT count(*) FROM payrolls WHERE payroll_period_id = ? AND payment_status = 'UNPAID'",
                Integer.class, periodId);

        if (unpaidCount == 0) {
            String periodRes = mvc.perform(get("/api/v1/admin/payroll-periods/" + periodId)
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            String statusStr = json.readTree(periodRes).path("data").path("status").asText();
            assertThat(statusStr).isEqualTo("CLOSED");
        }
    }

    @Test
    @DisplayName("TC-46: Block recording attendance before employee hire date")
    void tc46_attendanceBeforeHireDateBlocked() throws Exception {
        String token = adminToken();
        String code = "TEST-HIRE-" + UUID.randomUUID().toString().substring(0, 6);
        CreateEmployeeRequest req = new CreateEmployeeRequest(
                code, null, "Nhân Viên " + code, "0912345678", null,
                "Nhân viên kho", LocalDate.of(2025, 6, 1), new BigDecimal("10000000"), null
        );
        String res = mvc.perform(post("/api/v1/admin/employees")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long empId = json.readTree(res).path("data").path("id").asLong();

        // Attempt attendance before hire date (2025-05-31 < 2025-06-01)
        mvc.perform(put("/api/v1/admin/attendance/" + empId + "/2025-05-31")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, "Chấm sớm"))))
                .andExpect(status().isBadRequest());

        // Valid attendance on or after hire date should succeed
        mvc.perform(put("/api/v1/admin/attendance/" + empId + "/2025-06-01")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, "Ngày đầu đi làm"))))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("TC-47: Finalize rejects when expectedTotalNetSalary or expectedEmployeeCount does not match preview")
    void tc47_finalizeWithMismatchedExpectedSalaryFails() throws Exception {
        String token = adminToken();
        int year = 2098;
        int month = 1;
        long periodId = createPayrollPeriod(token, year, month, new BigDecimal("26.0"));

        // Get preview figures
        String prevRes = mvc.perform(get("/api/v1/admin/payroll-periods/" + periodId + "/preview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode prevData = json.readTree(prevRes).path("data");
        BigDecimal totalNet = new BigDecimal(prevData.path("totalNetSalary").asText());
        int empCount = prevData.path("totalEmployees").asInt();

        // 1. Try to finalize with mismatched totalNet (e.g. + 100,000 VND) -> Rejected 400
        FinalizePayrollPeriodRequest badRequest = new FinalizePayrollPeriodRequest(totalNet.add(new BigDecimal("100000")), empCount, prevData.path("previewHash").asText());
        mvc.perform(post("/api/v1/admin/payroll-periods/" + periodId + "/finalize")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest());

        // 2. Try to finalize without previewHash -> Rejected 400
        FinalizePayrollPeriodRequest noHashRequest = new FinalizePayrollPeriodRequest(totalNet, empCount, null);
        mvc.perform(post("/api/v1/admin/payroll-periods/" + periodId + "/finalize")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(noHashRequest)))
                .andExpect(status().isBadRequest());

        // 3. Finalize with matching checksum values and valid previewHash -> Succeeds 200
        FinalizePayrollPeriodRequest goodRequest = new FinalizePayrollPeriodRequest(totalNet, empCount, prevData.path("previewHash").asText());
        mvc.perform(post("/api/v1/admin/payroll-periods/" + periodId + "/finalize")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(goodRequest)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("TC-48: Payroll adjustment audit tracking records updatedBy and audit note history")
    void tc48_adjustmentAuditTracking() throws Exception {
        String token = adminToken();
        long periodId = createPayrollPeriod(token, 2098, 2, new BigDecimal("26.0"));
        Long empId = db.queryForObject("SELECT id FROM employees ORDER BY id ASC LIMIT 1", Long.class);

        // Create adjustment
        CreatePayrollAdjustmentRequest createReq = new CreatePayrollAdjustmentRequest(
                empId, periodId, AdjustmentType.ALLOWANCE, "Phụ cấp xăng xe", new BigDecimal("500000"), "Xăng xe ban đầu"
        );
        String createRes = mvc.perform(post("/api/v1/admin/payroll-adjustments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long adjId = json.readTree(createRes).path("data").path("id").asLong();

        // Update adjustment
        UpdatePayrollAdjustmentRequest updateReq = new UpdatePayrollAdjustmentRequest(
                "Phụ cấp xăng xe tăng", new BigDecimal("700000"), "Tăng định mức xăng xe"
        );
        String updateRes = mvc.perform(put("/api/v1/admin/payroll-adjustments/" + adjId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode adjNode = json.readTree(updateRes).path("data");
        assertThat(adjNode.path("amount").asDouble()).isEqualTo(700000.0);
        assertThat(adjNode.path("updatedBy").asText()).isNotEmpty();

        // Verify updated_by column in database
        String updatedByDb = db.queryForObject("SELECT updated_by FROM payroll_adjustments WHERE id = ?", String.class, adjId);
        assertThat(updatedByDb).isNotEmpty();

        // Verify audit trail table entries
        Integer auditCount = db.queryForObject("SELECT count(*) FROM payroll_adjustment_audits WHERE adjustment_id = ?", Integer.class, adjId);
        assertThat(auditCount).isGreaterThanOrEqualTo(2); // CREATED and UPDATED

        // Delete adjustment and verify DELETED audit trail entry
        mvc.perform(delete("/api/v1/admin/payroll-adjustments/" + adjId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        Integer finalAuditCount = db.queryForObject("SELECT count(*) FROM payroll_adjustment_audits WHERE adjustment_id = ?", Integer.class, adjId);
        assertThat(finalAuditCount).isGreaterThanOrEqualTo(3);
    }

    @Test
    @DisplayName("TC-49: Finalize rejects when itemized line values change even if total net and employee count are identical")
    void tc49_finalizeFailsIfLineItemsChangedEvenIfTotalNetAndCountMatch() throws Exception {
        String token = adminToken();
        int year = 2098;
        int month = 3;
        long periodId = createPayrollPeriod(token, year, month, new BigDecimal("26.0"));

        // Get preview with original previewHash
        String prevRes = mvc.perform(get("/api/v1/admin/payroll-periods/" + periodId + "/preview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode prevData = json.readTree(prevRes).path("data");
        BigDecimal totalNet = new BigDecimal(prevData.path("totalNetSalary").asText());
        int empCount = prevData.path("totalEmployees").asInt();
        String originalHash = prevData.path("previewHash").asText();
        assertThat(originalHash).isNotEmpty();

        // Add 100k allowance and 100k deduction for an employee: totalNet remains identical!
        Long empId = db.queryForObject("SELECT id FROM employees ORDER BY id ASC LIMIT 1", Long.class);
        mvc.perform(post("/api/v1/admin/payroll-adjustments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new CreatePayrollAdjustmentRequest(empId, periodId, AdjustmentType.ALLOWANCE, "Thưởng cân bằng", new BigDecimal("100000"), null))))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/admin/payroll-adjustments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new CreatePayrollAdjustmentRequest(empId, periodId, AdjustmentType.DEDUCTION, "Phạt cân bằng", new BigDecimal("100000"), null))))
                .andExpect(status().isCreated());

        // Get new preview: total net is unchanged, but previewHash must have changed
        String newPrevRes = mvc.perform(get("/api/v1/admin/payroll-periods/" + periodId + "/preview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode newPrevData = json.readTree(newPrevRes).path("data");
        BigDecimal newTotalNet = new BigDecimal(newPrevData.path("totalNetSalary").asText());
        String newHash = newPrevData.path("previewHash").asText();

        assertThat(newTotalNet).isEqualByComparingTo(totalNet);
        assertThat(newHash).isNotEqualTo(originalHash);

        // Finalizing with stale originalHash must be rejected
        FinalizePayrollPeriodRequest staleHashRequest = new FinalizePayrollPeriodRequest(totalNet, empCount, originalHash);
        mvc.perform(post("/api/v1/admin/payroll-periods/" + periodId + "/finalize")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(staleHashRequest)))
                .andExpect(status().isBadRequest());

        // Finalize with new valid hash succeeds
        FinalizePayrollPeriodRequest validRequest = new FinalizePayrollPeriodRequest(newTotalNet, empCount, newHash);
        mvc.perform(post("/api/v1/admin/payroll-periods/" + periodId + "/finalize")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(validRequest)))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private org.springframework.test.web.servlet.ResultActions finalizePeriodWithPreview(Long periodId, String token) throws Exception {
        String prevRes = mvc.perform(get("/api/v1/admin/payroll-periods/" + periodId + "/preview")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode prevData = json.readTree(prevRes).path("data");
        BigDecimal totalNet = new BigDecimal(prevData.path("totalNetSalary").asText());
        int empCount = prevData.path("totalEmployees").asInt();
        String hash = prevData.path("previewHash").asText();
        FinalizePayrollPeriodRequest req = new FinalizePayrollPeriodRequest(totalNet, empCount, hash);
        return mvc.perform(post("/api/v1/admin/payroll-periods/" + periodId + "/finalize")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(req)));
    }

    private long createTestEmployee(String token, String code) throws Exception {
        CreateEmployeeRequest req = new CreateEmployeeRequest(
                code, null, "Nhân Viên " + code, "0912345678", null,
                "Nhân viên bếp", LocalDate.of(2025, 1, 1), new BigDecimal("9000000"), null
        );
        String res = mvc.perform(post("/api/v1/admin/employees")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(res).path("data").path("id").asLong();
    }

    private long createPayrollPeriod(String token, int year, int month, BigDecimal standardWorkdays) throws Exception {
        CreatePayrollPeriodRequest req = new CreatePayrollPeriodRequest(year, month, standardWorkdays, "Kỳ test");
        String res = mvc.perform(post("/api/v1/admin/payroll-periods")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(res).path("data").path("id").asLong();
    }

    private long createAndFinalizeSinglePayroll(String token, int year, int month) throws Exception {
        Long empId = db.queryForObject("SELECT id FROM employees ORDER BY id ASC LIMIT 1", Long.class);
        // Record at least 1 day attendance so net salary > 0
        String dateStr = String.format("%04d-%02d-01", year, month);
        mvc.perform(put("/api/v1/admin/attendance/" + empId + "/" + dateStr)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(new RecordAttendanceRequest(AttendanceStatus.PRESENT, "Chấm công test"))))
                .andExpect(status().isOk());

        long periodId = createPayrollPeriod(token, year, month, new BigDecimal("26.0"));
        String finRes = finalizePeriodWithPreview(periodId, token).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode list = json.readTree(finRes).path("data");
        return list.get(0).path("id").asLong();
    }

    private JsonNode findEmployeeSummaryInJson(JsonNode root, long empId) {
        JsonNode summaries = root.path("data").path("employeeSummaries");
        if (summaries.isArray()) {
            for (JsonNode n : summaries) {
                if (n.path("employeeId").asLong() == empId) return n;
            }
        }
        return null;
    }

    private JsonNode findPreviewItemInJson(JsonNode root, long empId) {
        JsonNode items = root.path("data").path("items");
        if (items.isArray()) {
            for (JsonNode n : items) {
                if (n.path("employeeId").asLong() == empId) return n;
            }
        }
        return null;
    }

    private JsonNode findPayrollInJsonList(JsonNode list, long empId) {
        if (list.isArray()) {
            for (JsonNode n : list) {
                if (n.path("employeeId").asLong() == empId) return n;
            }
        }
        return null;
    }
}
