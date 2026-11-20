package com.banquethub.modules.users.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.DuplicateResourceException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.employees.entity.Employee;
import com.banquethub.modules.employees.repository.EmployeeRepository;
import com.banquethub.modules.orders.entity.Order;
import com.banquethub.modules.orders.entity.OrderStatus;
import com.banquethub.modules.orders.repository.OrderRepository;
import com.banquethub.modules.users.dto.*;
import com.banquethub.modules.users.entity.Role;
import com.banquethub.modules.users.entity.User;
import com.banquethub.modules.users.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public UserService(
            UserRepository userRepository,
            EmployeeRepository employeeRepository,
            OrderRepository orderRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Page<AdminUserSummaryDto> getUsers(String search, Role role, Boolean active, Pageable pageable) {
        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(search)) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("fullName")), searchPattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), searchPattern);
                Predicate phoneMatch = cb.like(root.get("phone"), searchPattern);
                predicates.add(cb.or(nameMatch, emailMatch, phoneMatch));
            }

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }

            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> usersPage = userRepository.findAll(spec, pageable);

        return usersPage.map(user -> {
            AdminUserSummaryDto dto = new AdminUserSummaryDto();
            dto.setId(user.getId());
            dto.setFullName(user.getFullName());
            dto.setEmail(user.getEmail());
            dto.setPhone(user.getPhone());
            dto.setRole(user.getRole());
            dto.setActive(user.isActive());
            dto.setLastLoginAt(user.getLastLoginAt());
            dto.setCreatedAt(user.getCreatedAt());
            dto.setUpdatedAt(user.getUpdatedAt());

            dto.setOrderCount(orderRepository.countByUserId(user.getId()));

            employeeRepository.findByUserId(user.getId()).ifPresent(emp -> {
                dto.setEmployeeId(emp.getId());
                dto.setEmployeeCode(emp.getEmployeeCode());
                dto.setEmployeePosition(emp.getPosition());
            });

            return dto;
        });
    }

    @Transactional(readOnly = true)
    public AdminUserDetailDto getUserDetail(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với ID: " + id));

        AdminUserDetailDto dto = new AdminUserDetailDto();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole());
        dto.setActive(user.isActive());
        dto.setLastLoginAt(user.getLastLoginAt());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());

        long orderCount = orderRepository.countByUserId(user.getId());
        dto.setTotalOrders(orderCount);

        List<Order> userOrders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        BigDecimal totalSpent = BigDecimal.ZERO;
        for (Order o : userOrders) {
            if (isOrderPaid(o)) {
                totalSpent = totalSpent.add(o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO);
            }
        }
        dto.setTotalSpent(totalSpent);

        List<Order> top5 = orderRepository.findTop5ByUserIdOrderByCreatedAtDesc(user.getId());
        List<UserOrderSummaryDto> recentOrderDtos = top5.stream().map(o -> new UserOrderSummaryDto(
                o.getId(),
                o.getOrderCode(),
                o.getEventDateTime(),
                o.getTableCount(),
                o.getOrderStatus(),
                o.getTotalAmount(),
                o.getCreatedAt()
        )).toList();
        dto.setRecentOrders(recentOrderDtos);

        employeeRepository.findByUserId(user.getId()).ifPresent(emp -> {
            dto.setEmployeeInfo(new UserEmployeeInfoDto(
                    emp.getId(),
                    emp.getEmployeeCode(),
                    emp.getFullName(),
                    emp.getPosition(),
                    emp.getHireDate(),
                    emp.getBaseSalary(),
                    emp.getStatus()
            ));
        });

        return dto;
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("Email '" + normalizedEmail + "' đã tồn tại trong hệ thống");
        }

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setRole(request.getRole() != null ? request.getRole() : Role.ROLE_USER);
        user.setActive(request.isActive());

        User savedUser = userRepository.save(user);

        if (savedUser.getRole() == Role.ROLE_EMPLOYEE) {
            if (request.getEmployeeId() != null) {
                Employee employee = employeeRepository.findById(request.getEmployeeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ nhân viên với ID: " + request.getEmployeeId()));
                if (employee.getUser() != null && !employee.getUser().getId().equals(savedUser.getId())) {
                    throw new BusinessValidationException("Hồ sơ nhân viên '" + employee.getFullName() + "' (" + employee.getEmployeeCode() + ") đã được liên kết với một tài khoản khác.");
                }
                employee.setUser(savedUser);
                employeeRepository.save(employee);
            } else {
                employeeRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(emp -> {
                    if (emp.getUser() == null) {
                        emp.setUser(savedUser);
                        employeeRepository.save(emp);
                    }
                });
            }
        }

        return UserResponse.fromEntity(savedUser);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request, Long currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với ID: " + id));

        // Self-demotion check
        if (user.getId().equals(currentUserId) && user.getRole() == Role.ROLE_ADMIN && request.getRole() != Role.ROLE_ADMIN) {
            throw new BusinessValidationException("Bạn không thể tự hạ quyền quản trị viên của chính mình.");
        }

        // Last active admin check when changing role away from ADMIN
        if (user.getRole() == Role.ROLE_ADMIN && request.getRole() != Role.ROLE_ADMIN && user.isActive()) {
            long activeAdmins = userRepository.countByRoleAndActiveTrue(Role.ROLE_ADMIN);
            if (activeAdmins <= 1) {
                throw new BusinessValidationException("Không thể hạ quyền tài khoản quản trị viên cuối cùng trong hệ thống.");
            }
        }

        // Self-deactivation check
        if (user.getId().equals(currentUserId) && request.getActive() != null && !request.getActive()) {
            throw new BusinessValidationException("Bạn không thể tự khóa tài khoản của chính mình.");
        }

        // Last active admin check when deactivating
        if (request.getActive() != null && !request.getActive() && user.getRole() == Role.ROLE_ADMIN && user.isActive()) {
            long activeAdmins = userRepository.countByRoleAndActiveTrue(Role.ROLE_ADMIN);
            if (activeAdmins <= 1) {
                throw new BusinessValidationException("Không thể khóa tài khoản quản trị viên cuối cùng trong hệ thống.");
            }
        }

        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setRole(request.getRole());
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        User updatedUser = userRepository.save(user);

        // Employee linkage management
        if (updatedUser.getRole() == Role.ROLE_EMPLOYEE) {
            if (request.getEmployeeId() != null) {
                Employee newEmp = employeeRepository.findById(request.getEmployeeId())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ nhân viên với ID: " + request.getEmployeeId()));
                if (newEmp.getUser() != null && !newEmp.getUser().getId().equals(updatedUser.getId())) {
                    throw new BusinessValidationException("Hồ sơ nhân viên '" + newEmp.getFullName() + "' (" + newEmp.getEmployeeCode() + ") đã liên kết với tài khoản khác.");
                }

                // Unlink old employee if different
                employeeRepository.findByUserId(updatedUser.getId()).ifPresent(oldEmp -> {
                    if (!oldEmp.getId().equals(newEmp.getId())) {
                        oldEmp.setUser(null);
                        employeeRepository.save(oldEmp);
                    }
                });

                newEmp.setUser(updatedUser);
                employeeRepository.save(newEmp);
            }
        } else {
            // Unlink employee if role changed to USER or ADMIN (keep employee intact, just detach user link)
            employeeRepository.findByUserId(updatedUser.getId()).ifPresent(emp -> {
                emp.setUser(null);
                employeeRepository.save(emp);
            });
        }

        return UserResponse.fromEntity(updatedUser);
    }

    @Transactional
    public UserResponse updateUserStatus(Long id, UpdateUserStatusRequest request, Long currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với ID: " + id));

        if (user.getId().equals(currentUserId) && !request.getActive()) {
            throw new BusinessValidationException("Bạn không thể tự khóa tài khoản của chính mình.");
        }

        if (!request.getActive() && user.getRole() == Role.ROLE_ADMIN && user.isActive()) {
            long activeAdmins = userRepository.countByRoleAndActiveTrue(Role.ROLE_ADMIN);
            if (activeAdmins <= 1) {
                throw new BusinessValidationException("Không thể khóa tài khoản quản trị viên cuối cùng trong hệ thống.");
            }
        }

        user.setActive(request.getActive());
        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Transactional
    public AdminResetPasswordResponse resetPasswordByAdmin(Long id, AdminResetPasswordRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với ID: " + id));

        String newPassword;
        if (request != null && StringUtils.hasText(request.getNewPassword())) {
            newPassword = request.getNewPassword().trim();
        } else {
            newPassword = "Bqh@" + (100000 + secureRandom.nextInt(900000)) + "!";
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return new AdminResetPasswordResponse(
                user.getId(),
                user.getEmail(),
                newPassword,
                "Đặt lại mật khẩu tài khoản thành công"
        );
    }

    @Transactional
    public void deleteUser(Long id, Long currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với ID: " + id));

        if (user.getId().equals(currentUserId)) {
            throw new BusinessValidationException("Bạn không thể tự xóa tài khoản của chính mình.");
        }

        if (user.getRole() == Role.ROLE_ADMIN) {
            long activeAdmins = userRepository.countByRoleAndActiveTrue(Role.ROLE_ADMIN);
            if (activeAdmins <= 1) {
                throw new BusinessValidationException("Không thể xóa tài khoản quản trị viên cuối cùng trong hệ thống.");
            }
        }

        if (orderRepository.existsByUserId(id)) {
            throw new BusinessValidationException("Không thể xóa vĩnh viễn tài khoản này vì đã có dữ liệu đơn tiệc trong hệ thống. Vui lòng sử dụng tính năng Khóa tài khoản.");
        }

        if (employeeRepository.existsByUserId(id)) {
            throw new BusinessValidationException("Không thể xóa vĩnh viễn tài khoản này vì đã liên kết với hồ sơ nhân viên. Vui lòng sử dụng tính năng Khóa tài khoản.");
        }

        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng"));
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng"));

        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);

        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Mật khẩu hiện tại không chính xác.");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessValidationException("Xác nhận mật khẩu mới không khớp với mật khẩu mới.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BusinessValidationException("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public List<UserEmployeeInfoDto> getUnlinkedEmployees(Long currentUserIdToInclude) {
        List<Employee> unlinked = employeeRepository.findByUserIsNull();
        List<UserEmployeeInfoDto> dtos = new ArrayList<>(unlinked.stream().map(emp -> new UserEmployeeInfoDto(
                emp.getId(),
                emp.getEmployeeCode(),
                emp.getFullName(),
                emp.getPosition(),
                emp.getHireDate(),
                emp.getBaseSalary(),
                emp.getStatus()
        )).toList());

        if (currentUserIdToInclude != null) {
            employeeRepository.findByUserId(currentUserIdToInclude).ifPresent(emp -> {
                boolean alreadyIn = dtos.stream().anyMatch(d -> d.getId().equals(emp.getId()));
                if (!alreadyIn) {
                    dtos.add(0, new UserEmployeeInfoDto(
                            emp.getId(),
                            emp.getEmployeeCode(),
                            emp.getFullName(),
                            emp.getPosition(),
                            emp.getHireDate(),
                            emp.getBaseSalary(),
                            emp.getStatus()
                    ));
                }
            });
        }

        return dtos;
    }

    private boolean isOrderPaid(Order order) {
        if (order.getPaidAt() != null) return true;
        OrderStatus s = order.getOrderStatus();
        return s == OrderStatus.PAID || s == OrderStatus.PREPARING || s == OrderStatus.COMPLETED;
    }
}
