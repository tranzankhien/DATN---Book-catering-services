package com.banquethub.modules.expenses.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.expenses.dto.ExpenseRequest;
import com.banquethub.modules.expenses.dto.ExpenseResponse;
import com.banquethub.modules.expenses.dto.ExpenseSummaryResponse;
import com.banquethub.modules.expenses.entity.ExpenseCategory;
import com.banquethub.modules.expenses.entity.ExpensePaymentStatus;
import com.banquethub.modules.expenses.entity.OperatingExpense;
import com.banquethub.modules.expenses.repository.OperatingExpenseRepository;
import com.banquethub.modules.users.entity.User;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ExpenseService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private final OperatingExpenseRepository expenseRepository;
    private final JdbcTemplate jdbcTemplate;

    public ExpenseService(OperatingExpenseRepository expenseRepository, JdbcTemplate jdbcTemplate) {
        this.expenseRepository = expenseRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public ExpenseResponse createExpense(ExpenseRequest request, User user) {
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Số tiền chi phí phải lớn hơn 0");
        }

        OperatingExpense expense = new OperatingExpense();
        expense.setExpenseCode(generateExpenseCode(request.getIncurredDate()));
        expense.setName(request.getName().trim());
        expense.setCategory(request.getCategory());
        expense.setAmount(request.getAmount());
        expense.setIncurredDate(request.getIncurredDate());
        expense.setPaymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : ExpensePaymentStatus.UNPAID);
        
        if (expense.getPaymentStatus() == ExpensePaymentStatus.PAID) {
            expense.setPaidAt(OffsetDateTime.now(VN_ZONE));
        }
        
        if (StringUtils.hasText(request.getNote())) {
            expense.setNote(request.getNote().trim());
        }
        expense.setCreatedBy(user);

        OperatingExpense saved = expenseRepository.save(expense);
        return ExpenseResponse.fromEntity(saved);
    }

    @Transactional
    public ExpenseResponse updateExpense(Long id, ExpenseRequest request, User user) {
        OperatingExpense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản chi phí ID: " + id));

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Số tiền chi phí phải lớn hơn 0");
        }

        expense.setName(request.getName().trim());
        expense.setCategory(request.getCategory());
        expense.setAmount(request.getAmount());
        expense.setIncurredDate(request.getIncurredDate());
        
        if (request.getPaymentStatus() != null && request.getPaymentStatus() != expense.getPaymentStatus()) {
            expense.setPaymentStatus(request.getPaymentStatus());
            if (request.getPaymentStatus() == ExpensePaymentStatus.PAID && expense.getPaidAt() == null) {
                expense.setPaidAt(OffsetDateTime.now(VN_ZONE));
            } else if (request.getPaymentStatus() == ExpensePaymentStatus.UNPAID) {
                expense.setPaidAt(null);
            }
        }

        if (StringUtils.hasText(request.getNote())) {
            expense.setNote(request.getNote().trim());
        } else {
            expense.setNote(null);
        }

        OperatingExpense saved = expenseRepository.save(expense);
        return ExpenseResponse.fromEntity(saved);
    }

    @Transactional
    public ExpenseResponse markAsPaid(Long id, User user) {
        OperatingExpense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản chi phí ID: " + id));

        if (expense.getPaymentStatus() == ExpensePaymentStatus.PAID) {
            throw new BusinessValidationException("Khoản chi phí này đã được ghi nhận thanh toán trước đó");
        }

        expense.setPaymentStatus(ExpensePaymentStatus.PAID);
        expense.setPaidAt(OffsetDateTime.now(VN_ZONE));
        OperatingExpense saved = expenseRepository.save(expense);
        return ExpenseResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteExpense(Long id) {
        OperatingExpense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản chi phí ID: " + id));

        if (expense.getPaymentStatus() == ExpensePaymentStatus.PAID) {
            throw new BusinessValidationException("Không thể xóa khoản chi phí đã thanh toán. Vui lòng chuyển trạng thái về Chưa thanh toán trước nếu muốn xóa.");
        }

        expenseRepository.delete(expense);
    }

    @Transactional(readOnly = true)
    public ExpenseResponse getExpenseById(Long id) {
        OperatingExpense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản chi phí ID: " + id));
        return ExpenseResponse.fromEntity(expense);
    }

    @Transactional(readOnly = true)
    public Page<ExpenseResponse> searchExpenses(
            LocalDate fromDate,
            LocalDate toDate,
            ExpenseCategory category,
            ExpensePaymentStatus status,
            String keyword,
            Pageable pageable
    ) {
        Specification<OperatingExpense> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("incurredDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("incurredDate"), toDate));
            }
            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("paymentStatus"), status));
            }
            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("expenseCode")), pattern);
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                Predicate noteMatch = cb.like(cb.lower(root.get("note")), pattern);
                predicates.add(cb.or(codeMatch, nameMatch, noteMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return expenseRepository.findAll(spec, pageable).map(ExpenseResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ExpenseSummaryResponse getSummary(LocalDate fromDate, LocalDate toDate) {
        Specification<OperatingExpense> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("incurredDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("incurredDate"), toDate));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<OperatingExpense> all = expenseRepository.findAll(spec);
        BigDecimal totalExpenses = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalUnpaid = BigDecimal.ZERO;

        for (OperatingExpense e : all) {
            BigDecimal amt = e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO;
            totalExpenses = totalExpenses.add(amt);
            if (e.getPaymentStatus() == ExpensePaymentStatus.PAID) {
                totalPaid = totalPaid.add(amt);
            } else {
                totalUnpaid = totalUnpaid.add(amt);
            }
        }

        return new ExpenseSummaryResponse(totalExpenses, totalPaid, totalUnpaid, (long) all.size());
    }

    private String generateExpenseCode(LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now(VN_ZONE);
        String prefix = "EXP-" + target.format(DateTimeFormatter.ofPattern("yyyyMM")) + "-";
        Long nextVal = jdbcTemplate.queryForObject("SELECT nextval('operating_expense_code_seq')", Long.class);
        return String.format("%s%04d", prefix, (nextVal != null ? nextVal : 1) % 10000);
    }
}
