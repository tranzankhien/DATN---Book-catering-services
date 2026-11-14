package com.banquethub.common.config;

import com.banquethub.modules.employees.entity.Employee;
import com.banquethub.modules.employees.entity.EmployeeStatus;
import com.banquethub.modules.employees.repository.EmployeeRepository;
import com.banquethub.modules.users.entity.Role;
import com.banquethub.modules.users.entity.User;
import com.banquethub.modules.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class DemoDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean seedEnabled;
    private final String adminEmail;
    private final String adminPassword;
    private final String employeeEmail;
    private final String employeePassword;
    private final String userEmail;
    private final String userPassword;

    public DemoDataInitializer(
            UserRepository userRepository,
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed.enabled:true}") boolean seedEnabled,
            @Value("${app.seed.admin-email:admin@banquethub.vn}") String adminEmail,
            @Value("${app.seed.admin-password:}") String adminPassword,
            @Value("${app.seed.employee-email:employee@banquethub.vn}") String employeeEmail,
            @Value("${app.seed.employee-password:}") String employeePassword,
            @Value("${app.seed.user-email:user@banquethub.vn}") String userEmail,
            @Value("${app.seed.user-password:}") String userPassword
    ) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.seedEnabled = seedEnabled;
        this.adminEmail = adminEmail;
        this.adminPassword = StringUtils.hasText(adminPassword) ? adminPassword : "Admin@123";
        this.employeeEmail = employeeEmail;
        this.employeePassword = StringUtils.hasText(employeePassword) ? employeePassword : "Employee@123";
        this.userEmail = userEmail;
        this.userPassword = StringUtils.hasText(userPassword) ? userPassword : "User@123";
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seedEnabled) {
            log.info("Bỏ qua khởi tạo tài khoản demo vì app.seed.enabled=false.");
            return;
        }

        ensureUserExists(
                "Quản Trị Viên BanquetHub",
                adminEmail,
                adminPassword,
                "0901000001",
                Role.ROLE_ADMIN
        );
        User empUser = ensureUserExists(
                "Điều Phối Viên Tiệc",
                employeeEmail,
                employeePassword,
                "0901000002",
                Role.ROLE_EMPLOYEE
        );
        ensureUserExists(
                "Nguyễn Minh Khách",
                userEmail,
                userPassword,
                "0901000003",
                Role.ROLE_USER
        );

        if (empUser != null) {
            ensureDemoEmployeeExists(empUser);
        }
    }

    private User ensureUserExists(String fullName, String email, String rawPassword, String phone, Role role) {
        String normalizedEmail = email.trim().toLowerCase();
        return userRepository.findByEmailIgnoreCase(normalizedEmail).orElseGet(() -> {
            User user = new User();
            user.setFullName(fullName);
            user.setEmail(normalizedEmail);
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            user.setPhone(phone);
            user.setRole(role);
            user.setActive(true);
            User saved = userRepository.save(user);
            log.info("Đã khởi tạo tài khoản demo: {} ({})", normalizedEmail, role);
            return saved;
        });
    }

    private void ensureDemoEmployeeExists(User employeeUser) {
        if (employeeRepository.existsByEmployeeCode("EMP-001")) {
            return;
        }
        Employee emp = new Employee();
        emp.setEmployeeCode("EMP-001");
        emp.setUser(employeeUser);
        emp.setFullName(employeeUser.getFullName());
        emp.setPhone(employeeUser.getPhone() != null ? employeeUser.getPhone() : "0912345678");
        emp.setEmail(employeeUser.getEmail());
        emp.setPosition("Bếp trưởng & Điều phối tiệc");
        emp.setHireDate(LocalDate.of(2025, 1, 15));
        emp.setBaseSalary(new BigDecimal("9000000.00"));
        emp.setStatus(EmployeeStatus.ACTIVE);
        emp.setNote("Nhân viên mẫu hệ thống BanquetHub");
        employeeRepository.save(emp);
        log.info("Đã khởi tạo hồ sơ nhân viên demo EMP-001 liên kết với {}", employeeUser.getEmail());
    }
}
