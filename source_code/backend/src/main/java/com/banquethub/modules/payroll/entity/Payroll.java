package com.banquethub.modules.payroll.entity;

import com.banquethub.modules.employees.entity.Employee;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Entity
@Table(
        name = "payrolls",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_payroll_employee_period",
                columnNames = {"employee_id", "payroll_period_id"}
        )
)
public class Payroll {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_period_id", nullable = false)
    private PayrollPeriod payrollPeriod;

    @Column(name = "employee_code_snapshot", nullable = false, length = 30)
    private String employeeCodeSnapshot;

    @Column(name = "employee_name_snapshot", nullable = false, length = 120)
    private String employeeNameSnapshot;

    @Column(name = "base_salary_snapshot", nullable = false, precision = 15, scale = 2)
    private BigDecimal baseSalarySnapshot;

    @Column(name = "standard_workdays_snapshot", nullable = false, precision = 5, scale = 2)
    private BigDecimal standardWorkdaysSnapshot;

    @Column(name = "actual_workdays_snapshot", nullable = false, precision = 5, scale = 2)
    private BigDecimal actualWorkdaysSnapshot;

    @Column(name = "calculated_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal calculatedSalary;

    @Column(name = "total_allowances", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAllowances = BigDecimal.ZERO;

    @Column(name = "total_deductions", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Column(name = "net_salary", nullable = false, precision = 15, scale = 2)
    private BigDecimal netSalary;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Column(name = "finalized_at", nullable = false)
    private OffsetDateTime finalizedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public Payroll() {
    }

    @PrePersist
    public void prePersist() {
        OffsetDateTime now = OffsetDateTime.now(VN_ZONE);
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.finalizedAt == null) {
            this.finalizedAt = now;
        }
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public PayrollPeriod getPayrollPeriod() {
        return payrollPeriod;
    }

    public void setPayrollPeriod(PayrollPeriod payrollPeriod) {
        this.payrollPeriod = payrollPeriod;
    }

    public String getEmployeeCodeSnapshot() {
        return employeeCodeSnapshot;
    }

    public void setEmployeeCodeSnapshot(String employeeCodeSnapshot) {
        this.employeeCodeSnapshot = employeeCodeSnapshot;
    }

    public String getEmployeeNameSnapshot() {
        return employeeNameSnapshot;
    }

    public void setEmployeeNameSnapshot(String employeeNameSnapshot) {
        this.employeeNameSnapshot = employeeNameSnapshot;
    }

    public BigDecimal getBaseSalarySnapshot() {
        return baseSalarySnapshot;
    }

    public void setBaseSalarySnapshot(BigDecimal baseSalarySnapshot) {
        this.baseSalarySnapshot = baseSalarySnapshot;
    }

    public BigDecimal getStandardWorkdaysSnapshot() {
        return standardWorkdaysSnapshot;
    }

    public void setStandardWorkdaysSnapshot(BigDecimal standardWorkdaysSnapshot) {
        this.standardWorkdaysSnapshot = standardWorkdaysSnapshot;
    }

    public BigDecimal getActualWorkdaysSnapshot() {
        return actualWorkdaysSnapshot;
    }

    public void setActualWorkdaysSnapshot(BigDecimal actualWorkdaysSnapshot) {
        this.actualWorkdaysSnapshot = actualWorkdaysSnapshot;
    }

    public BigDecimal getCalculatedSalary() {
        return calculatedSalary;
    }

    public void setCalculatedSalary(BigDecimal calculatedSalary) {
        this.calculatedSalary = calculatedSalary;
    }

    public BigDecimal getTotalAllowances() {
        return totalAllowances;
    }

    public void setTotalAllowances(BigDecimal totalAllowances) {
        this.totalAllowances = totalAllowances;
    }

    public BigDecimal getTotalDeductions() {
        return totalDeductions;
    }

    public void setTotalDeductions(BigDecimal totalDeductions) {
        this.totalDeductions = totalDeductions;
    }

    public BigDecimal getNetSalary() {
        return netSalary;
    }

    public void setNetSalary(BigDecimal netSalary) {
        this.netSalary = netSalary;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public OffsetDateTime getFinalizedAt() {
        return finalizedAt;
    }

    public void setFinalizedAt(OffsetDateTime finalizedAt) {
        this.finalizedAt = finalizedAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
