package com.banquethub.common.config;

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

@Component
public class DemoDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final UserRepository userRepository;
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
        ensureUserExists(
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
    }

    private void ensureUserExists(String fullName, String email, String rawPassword, String phone, Role role) {
        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            return;
        }
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setPhone(phone);
        user.setRole(role);
        user.setActive(true);
        userRepository.save(user);
        log.info("Đã khởi tạo tài khoản demo: {} ({})", normalizedEmail, role);
    }
}
