package com.banquethub.modules.employees.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.employees.dto.CreateEmployeeRequest;
import com.banquethub.modules.employees.dto.EmployeeDto;
import com.banquethub.modules.employees.dto.UpdateEmployeeRequest;
import com.banquethub.modules.employees.dto.UpdateEmployeeStatusRequest;
import com.banquethub.modules.employees.entity.EmployeeStatus;
import com.banquethub.modules.employees.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/employees")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Tag(name = "Admin Employee Management", description = "Quản lý hồ sơ nhân viên BanquetHub")
public class AdminEmployeeController {

    private final EmployeeService employeeService;

    public AdminEmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách nhân viên có phân trang, lọc và tìm kiếm")
    public ResponseEntity<ApiResponse<Page<EmployeeDto>>> getEmployees(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) EmployeeStatus status,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<EmployeeDto> result = employeeService.getEmployees(search, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách nhân viên thành công", result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết hồ sơ nhân viên")
    public ResponseEntity<ApiResponse<EmployeeDto>> getEmployeeById(@PathVariable Long id) {
        EmployeeDto result = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin nhân viên thành công", result));
    }

    @PostMapping
    @Operation(summary = "Thêm nhân viên mới")
    public ResponseEntity<ApiResponse<EmployeeDto>> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeDto result = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Thêm nhân viên mới thành công", result));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Chỉnh sửa thông tin nhân viên")
    public ResponseEntity<ApiResponse<EmployeeDto>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request
    ) {
        EmployeeDto result = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thông tin nhân viên thành công", result));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Thay đổi trạng thái hoạt động của nhân viên")
    public ResponseEntity<ApiResponse<EmployeeDto>> updateEmployeeStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeStatusRequest request
    ) {
        EmployeeDto result = employeeService.updateEmployeeStatus(id, request.status());
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái nhân viên thành công", result));
    }
}
