package com.banquethub.modules.employees.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.DuplicateResourceException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.employees.dto.CreateEmployeeRequest;
import com.banquethub.modules.employees.dto.EmployeeDto;
import com.banquethub.modules.employees.dto.UpdateEmployeeRequest;
import com.banquethub.modules.employees.entity.Employee;
import com.banquethub.modules.employees.entity.EmployeeStatus;
import com.banquethub.modules.employees.repository.EmployeeRepository;
import com.banquethub.modules.users.entity.Role;
import com.banquethub.modules.users.entity.User;
import com.banquethub.modules.users.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public EmployeeService(EmployeeRepository employeeRepository, UserRepository userRepository) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<EmployeeDto> getEmployees(String search, EmployeeStatus status, Pageable pageable) {
        Specification<Employee> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("employeeCode")), searchPattern);
                Predicate nameMatch = cb.like(cb.lower(root.get("fullName")), searchPattern);
                Predicate phoneMatch = cb.like(cb.lower(root.get("phone")), searchPattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), searchPattern);
                Predicate posMatch = cb.like(cb.lower(root.get("position")), searchPattern);
                predicates.add(cb.or(codeMatch, nameMatch, phoneMatch, emailMatch, posMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return employeeRepository.findAll(spec, pageable).map(EmployeeDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public EmployeeDto getEmployeeById(Long id) {
        Employee employee = employeeRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));
        return EmployeeDto.fromEntity(employee);
    }

    @Transactional(readOnly = true)
    public EmployeeDto getEmployeeByUserId(Long userId) {
        Employee employee = employeeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản của bạn chưa được liên kết với hồ sơ nhân viên trong hệ thống."));
        return EmployeeDto.fromEntity(employee);
    }

    public EmployeeDto createEmployee(CreateEmployeeRequest request) {
        // 1. Employee code generation or validation
        String code = request.employeeCode();
        if (code == null || code.trim().isEmpty()) {
            Long maxId = employeeRepository.findMaxId();
            long nextNum = (maxId != null ? maxId : 0) + 1;
            code = String.format("EMP-%03d", nextNum);
            while (employeeRepository.existsByEmployeeCode(code)) {
                nextNum++;
                code = String.format("EMP-%03d", nextNum);
            }
        } else {
            code = code.trim().toUpperCase();
            if (employeeRepository.existsByEmployeeCode(code)) {
                throw new DuplicateResourceException("Mã nhân viên '" + code + "' đã tồn tại trong hệ thống.");
            }
        }

        // 2. Base salary validation
        if (request.baseSalary() == null || request.baseSalary().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException("Mức lương cơ bản không được âm.");
        }

        // 3. Optional User linking validation
        User linkedUser = null;
        if (request.userId() != null) {
            linkedUser = userRepository.findById(request.userId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với ID: " + request.userId()));

            if (linkedUser.getRole() != Role.ROLE_EMPLOYEE) {
                throw new BusinessValidationException("Tài khoản liên kết phải có quyền Nhân viên (ROLE_EMPLOYEE).");
            }

            if (employeeRepository.existsByUserId(request.userId())) {
                throw new DuplicateResourceException("Tài khoản người dùng này đã được liên kết với một hồ sơ nhân viên khác.");
            }
        }

        Employee employee = new Employee();
        employee.setEmployeeCode(code);
        employee.setUser(linkedUser);
        employee.setFullName(request.fullName().trim());
        employee.setPhone(request.phone() != null ? request.phone().trim() : null);
        employee.setEmail(request.email() != null ? request.email().trim().toLowerCase() : null);
        employee.setPosition(request.position().trim());
        employee.setHireDate(request.hireDate());
        employee.setBaseSalary(request.baseSalary());
        employee.setStatus(EmployeeStatus.ACTIVE);
        employee.setNote(request.note() != null ? request.note().trim() : null);

        Employee saved = employeeRepository.save(employee);
        return EmployeeDto.fromEntity(saved);
    }

    public EmployeeDto updateEmployee(Long id, UpdateEmployeeRequest request) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));

        // Base salary validation
        if (request.baseSalary() == null || request.baseSalary().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException("Mức lương cơ bản không được âm.");
        }

        // User link validation
        User linkedUser = null;
        if (request.userId() != null) {
            linkedUser = userRepository.findById(request.userId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với ID: " + request.userId()));

            if (linkedUser.getRole() != Role.ROLE_EMPLOYEE) {
                throw new BusinessValidationException("Tài khoản liên kết phải có quyền Nhân viên (ROLE_EMPLOYEE).");
            }

            if (employeeRepository.existsByUserIdAndIdNot(request.userId(), id)) {
                throw new DuplicateResourceException("Tài khoản người dùng này đã được liên kết với một hồ sơ nhân viên khác.");
            }
        }

        employee.setUser(linkedUser);
        employee.setFullName(request.fullName().trim());
        employee.setPhone(request.phone() != null ? request.phone().trim() : null);
        employee.setEmail(request.email() != null ? request.email().trim().toLowerCase() : null);
        employee.setPosition(request.position().trim());
        employee.setHireDate(request.hireDate());
        employee.setBaseSalary(request.baseSalary());
        if (request.status() != null) {
            employee.setStatus(request.status());
        }
        employee.setNote(request.note() != null ? request.note().trim() : null);

        Employee saved = employeeRepository.save(employee);
        return EmployeeDto.fromEntity(saved);
    }

    public EmployeeDto updateEmployeeStatus(Long id, EmployeeStatus status) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên với ID: " + id));

        employee.setStatus(status);
        Employee saved = employeeRepository.save(employee);
        return EmployeeDto.fromEntity(saved);
    }
}
