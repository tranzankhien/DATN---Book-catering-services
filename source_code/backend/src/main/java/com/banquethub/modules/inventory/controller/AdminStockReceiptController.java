package com.banquethub.modules.inventory.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.inventory.dto.StockReceiptCreateRequest;
import com.banquethub.modules.inventory.dto.StockReceiptPaymentRequest;
import com.banquethub.modules.inventory.dto.StockReceiptResponse;
import com.banquethub.modules.inventory.entity.PaymentStatus;
import com.banquethub.modules.inventory.entity.StockReceiptStatus;
import com.banquethub.modules.inventory.service.PdfExportService;
import com.banquethub.modules.inventory.service.StockReceiptService;
import com.banquethub.modules.users.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/stock-receipts")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Tag(name = "Admin Stock Receipts", description = "API Quản trị phiếu nhập nguyên liệu và xuất hóa đơn PDF")
public class AdminStockReceiptController {

    private final StockReceiptService stockReceiptService;
    private final PdfExportService pdfExportService;

    public AdminStockReceiptController(
            StockReceiptService stockReceiptService,
            PdfExportService pdfExportService
    ) {
        this.stockReceiptService = stockReceiptService;
        this.pdfExportService = pdfExportService;
    }

    @GetMapping
    @Operation(summary = "Danh sách phiếu nhập hàng (tìm kiếm theo NCC, trạng thái phiếu, trạng thái thanh toán, khoảng ngày)")
    public ResponseEntity<ApiResponse<List<StockReceiptResponse>>> getReceipts(
            @RequestParam(required = false) Long supplierId,
            @RequestParam(required = false) StockReceiptStatus status,
            @RequestParam(required = false) PaymentStatus paymentStatus,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                stockReceiptService.searchReceipts(supplierId, status, paymentStatus, fromDate, toDate, keyword)
        ));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một phiếu nhập hàng kèm danh sách nguyên liệu")
    public ResponseEntity<ApiResponse<StockReceiptResponse>> getReceiptById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(stockReceiptService.getReceiptById(id)));
    }

    @PostMapping
    @Operation(summary = "Tạo phiếu nhập nguyên liệu mới (lưu Nháp hoặc Xác nhận nhập ngay)")
    public ResponseEntity<ApiResponse<StockReceiptResponse>> createReceipt(
            @Valid @RequestBody StockReceiptCreateRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        StockReceiptResponse created = stockReceiptService.createReceipt(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo phiếu nhập nguyên liệu thành công", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Chỉnh sửa thông tin phiếu nhập Nháp (chỉ áp dụng khi chưa xác nhận)")
    public ResponseEntity<ApiResponse<StockReceiptResponse>> updateReceipt(
            @PathVariable Long id,
            @Valid @RequestBody StockReceiptCreateRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        StockReceiptResponse updated = stockReceiptService.updateDraftReceipt(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật phiếu nhập thành công", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa phiếu nhập Nháp (chỉ áp dụng khi chưa xác nhận)")
    public ResponseEntity<ApiResponse<Void>> deleteReceipt(@PathVariable Long id) {
        stockReceiptService.deleteDraftReceipt(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa phiếu nhập nháp thành công", null));
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Xác nhận phiếu nhập: tăng tồn kho nguyên liệu, tính lại giá vốn bình quân di động và ghi sổ biến động")
    public ResponseEntity<ApiResponse<StockReceiptResponse>> confirmReceipt(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        StockReceiptResponse confirmed = stockReceiptService.confirmReceipt(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Xác nhận nhập kho thành công! Đã cập nhật tồn kho và giá vốn.", confirmed));
    }

    @PostMapping("/{id}/payments")
    @Operation(summary = "Ghi nhận thanh toán thêm cho nhà cung cấp theo phiếu nhập")
    public ResponseEntity<ApiResponse<StockReceiptResponse>> recordPayment(
            @PathVariable Long id,
            @Valid @RequestBody StockReceiptPaymentRequest request
    ) {
        StockReceiptResponse response = stockReceiptService.recordPayment(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Ghi nhận thanh toán thành công", response));
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Xuất phiếu nhập nguyên liệu sang file PDF khổ A4 chuẩn in ấn")
    public ResponseEntity<byte[]> exportReceiptPdf(@PathVariable Long id) {
        StockReceiptResponse receipt = stockReceiptService.getReceiptById(id);
        byte[] pdfBytes = pdfExportService.generateStockReceiptPdf(id);

        String filename = "phieu-nhap-" + receipt.getCode() + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
