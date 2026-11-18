package com.banquethub.modules.expenses.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.expenses.dto.ExpenseRequest;
import com.banquethub.modules.expenses.dto.ExpenseResponse;
import com.banquethub.modules.expenses.dto.ExpenseSummaryResponse;
import com.banquethub.modules.expenses.entity.ExpenseCategory;
import com.banquethub.modules.expenses.entity.ExpensePaymentStatus;
import com.banquethub.modules.expenses.service.ExpenseService;
import com.banquethub.modules.users.entity.User;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/expenses")
@PreAuthorize("hasRole('ADMIN')")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExpenseResponse>>> getExpenses(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) ExpenseCategory category,
            @RequestParam(required = false) ExpensePaymentStatus status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "incurredDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Page<ExpenseResponse> result = expenseService.searchExpenses(fromDate, toDate, category, status, keyword, PageRequest.of(page, size, sort));
        return ResponseEntity.ok(ApiResponse.success(result, "Tải danh sách chi phí vận hành thành công"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<ExpenseSummaryResponse>> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        ExpenseSummaryResponse summary = expenseService.getSummary(fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success(summary, "Tải tổng hợp chi phí thành công"));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getCategories() {
        List<Map<String, String>> categories = Arrays.stream(ExpenseCategory.values())
                .map(cat -> Map.of(
                        "code", cat.name(),
                        "name", cat.getDescription()
                ))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(categories, "Tải danh mục chi phí thành công"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseResponse>> getExpenseById(@PathVariable Long id) {
        ExpenseResponse expense = expenseService.getExpenseById(id);
        return ResponseEntity.ok(ApiResponse.success(expense, "Tải thông tin chi phí thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseResponse>> createExpense(
            @Valid @RequestBody ExpenseRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        ExpenseResponse created = expenseService.createExpense(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Thêm khoản chi phí vận hành mới thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseResponse>> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        ExpenseResponse updated = expenseService.updateExpense(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(updated, "Cập nhật khoản chi phí thành công"));
    }

    @PatchMapping("/{id}/pay")
    public ResponseEntity<ApiResponse<ExpenseResponse>> markAsPaid(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        ExpenseResponse paid = expenseService.markAsPaid(id, currentUser);
        return ResponseEntity.ok(ApiResponse.success(paid, "Ghi nhận thanh toán chi phí thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa khoản chi phí thành công"));
    }
}
