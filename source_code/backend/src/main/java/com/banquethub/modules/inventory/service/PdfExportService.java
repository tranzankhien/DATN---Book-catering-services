package com.banquethub.modules.inventory.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.inventory.entity.PaymentStatus;
import com.banquethub.modules.inventory.entity.StockReceipt;
import com.banquethub.modules.inventory.entity.StockReceiptItem;
import com.banquethub.modules.inventory.entity.StockReceiptStatus;
import com.banquethub.modules.inventory.repository.StockReceiptRepository;
import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class PdfExportService {

    private final StockReceiptRepository stockReceiptRepository;

    private BaseFont baseFontRegular;
    private BaseFont baseFontBold;

    public PdfExportService(StockReceiptRepository stockReceiptRepository) {
        this.stockReceiptRepository = stockReceiptRepository;
        initFonts();
    }

    private synchronized void initFonts() {
        if (baseFontRegular != null && baseFontBold != null) {
            return;
        }
        try {
            ClassPathResource regRes = new ClassPathResource("fonts/NotoSans-Regular.ttf");
            ClassPathResource boldRes = new ClassPathResource("fonts/NotoSans-Bold.ttf");

            byte[] regBytes;
            try (InputStream is = regRes.getInputStream()) {
                regBytes = is.readAllBytes();
            }
            byte[] boldBytes;
            try (InputStream is = boldRes.getInputStream()) {
                boldBytes = is.readAllBytes();
            }

            this.baseFontRegular = BaseFont.createFont(
                    "NotoSans-Regular.ttf",
                    BaseFont.IDENTITY_H,
                    BaseFont.EMBEDDED,
                    true,
                    regBytes,
                    null
            );
            this.baseFontBold = BaseFont.createFont(
                    "NotoSans-Bold.ttf",
                    BaseFont.IDENTITY_H,
                    BaseFont.EMBEDDED,
                    true,
                    boldBytes,
                    null
            );
        } catch (Exception ex) {
            throw new IllegalStateException("Không thể khởi tạo bộ font Unicode Noto Sans cho PDF export", ex);
        }
    }

    @Transactional(readOnly = true)
    public byte[] generateStockReceiptPdf(Long receiptId) {
        StockReceipt receipt = stockReceiptRepository.findWithItemsById(receiptId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập với ID: " + receiptId));

        initFonts();

        Font fontHeaderOrg = new Font(baseFontBold, 12, Font.BOLD, new Color(180, 83, 9)); // Amber-700
        Font fontOrgSub = new Font(baseFontRegular, 8.5f, Font.NORMAL, new Color(100, 100, 100));
        Font fontTitle = new Font(baseFontBold, 17, Font.BOLD, new Color(28, 25, 23)); // Stone-900
        Font fontSubTitle = new Font(baseFontRegular, 9.5f, Font.ITALIC, new Color(120, 113, 108));
        Font fontSectionHeader = new Font(baseFontBold, 9.5f, Font.BOLD, new Color(28, 25, 23));
        Font fontLabel = new Font(baseFontBold, 8.5f, Font.BOLD, new Color(68, 64, 60));
        Font fontValue = new Font(baseFontRegular, 8.5f, Font.NORMAL, new Color(28, 25, 23));
        Font fontTableHeader = new Font(baseFontBold, 8.5f, Font.BOLD, Color.WHITE);
        Font fontTableCell = new Font(baseFontRegular, 8.5f, Font.NORMAL, new Color(28, 25, 23));
        Font fontTableCellBold = new Font(baseFontBold, 8.5f, Font.BOLD, new Color(28, 25, 23));
        Font fontTotalLabel = new Font(baseFontBold, 9f, Font.BOLD, new Color(28, 25, 23));
        Font fontTotalValue = new Font(baseFontBold, 9.5f, Font.BOLD, new Color(180, 83, 9));
        Font fontSignTitle = new Font(baseFontBold, 9f, Font.BOLD, new Color(41, 37, 36));
        Font fontSignNote = new Font(baseFontRegular, 8f, Font.ITALIC, new Color(120, 113, 108));

        DecimalFormat vndFormat = new DecimalFormat("#,##0 ₫", DecimalFormatSymbols.getInstance(new Locale("vi", "VN")));
        DecimalFormat qtyFormat = new DecimalFormat("#,##0.###", DecimalFormatSymbols.getInstance(new Locale("vi", "VN")));
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter dtfFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);

        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            // 1. Header tổ chức
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{65, 35});

            PdfPCell orgCell = new PdfPCell();
            orgCell.setBorder(Rectangle.NO_BORDER);
            orgCell.addElement(new Paragraph("TRUNG TÂM YẾN TIỆC & HỘI NGHỊ BANQUETHUB", fontHeaderOrg));
            orgCell.addElement(new Paragraph("Địa chỉ: 125 Trần Phú, Phường 5, TP. Hồ Chí Minh", fontOrgSub));
            orgCell.addElement(new Paragraph("Hotline: 1900 8899 | Email: contact@banquethub.vn", fontOrgSub));
            headerTable.addCell(orgCell);

            PdfPCell metaCell = new PdfPCell();
            metaCell.setBorder(Rectangle.NO_BORDER);
            metaCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph pCode = new Paragraph("Mã phiếu: " + receipt.getCode(), fontLabel);
            pCode.setAlignment(Element.ALIGN_RIGHT);
            Paragraph pDate = new Paragraph("Ngày nhập: " + receipt.getReceiptDate().format(dateFormatter), fontValue);
            pDate.setAlignment(Element.ALIGN_RIGHT);
            Paragraph pStatus = new Paragraph("Trạng thái: " + (receipt.getStatus() == StockReceiptStatus.CONFIRMED ? "ĐÃ XÁC NHẬN" : "BẢN NHÁP"), fontLabel);
            pStatus.setAlignment(Element.ALIGN_RIGHT);
            metaCell.addElement(pCode);
            metaCell.addElement(pDate);
            metaCell.addElement(pStatus);
            headerTable.addCell(metaCell);

            document.add(headerTable);

            // Divider
            Paragraph divider = new Paragraph(" ");
            divider.setSpacingAfter(6);
            document.add(divider);

            // 2. Title
            Paragraph title = new Paragraph("PHIẾU NHẬP NGUYÊN LIỆU", fontTitle);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(3);
            document.add(title);

            Paragraph subTitle = new Paragraph("(Chứng từ nhập kho và ghi nhận giá vốn bình quân theo quy chuẩn BR-07)", fontSubTitle);
            subTitle.setAlignment(Element.ALIGN_CENTER);
            subTitle.setSpacingAfter(14);
            document.add(subTitle);

            // 3. Thông tin Nhà cung cấp & Ghi chú
            PdfPTable infoTable = new PdfPTable(2);
            infoTable.setWidthPercentage(100);
            infoTable.setWidths(new float[]{50, 50});
            infoTable.setSpacingAfter(12);

            PdfPCell nccCell = new PdfPCell();
            nccCell.setBackgroundColor(new Color(250, 250, 249));
            nccCell.setBorderColor(new Color(229, 231, 235));
            nccCell.setPadding(8);
            nccCell.addElement(new Paragraph("THÔNG TIN NHÀ CUNG CẤP", fontSectionHeader));
            nccCell.addElement(new Paragraph("Tên NCC: " + (receipt.getSupplier() != null ? receipt.getSupplier().getName() : "—"), fontValue));
            nccCell.addElement(new Paragraph("Số điện thoại: " + (receipt.getSupplier() != null ? receipt.getSupplier().getPhone() : "—"), fontValue));
            nccCell.addElement(new Paragraph("Địa chỉ: " + (receipt.getSupplier() != null && receipt.getSupplier().getAddress() != null ? receipt.getSupplier().getAddress() : "—"), fontValue));
            infoTable.addCell(nccCell);

            PdfPCell payCell = new PdfPCell();
            payCell.setBackgroundColor(new Color(250, 250, 249));
            payCell.setBorderColor(new Color(229, 231, 235));
            payCell.setPadding(8);
            payCell.addElement(new Paragraph("THANH TOÁN & GIAO DỊCH", fontSectionHeader));
            String payStatusText = switch (receipt.getPaymentStatus()) {
                case PAID -> "ĐÃ THANH TOÁN ĐỦ";
                case PARTIALLY_PAID -> "THANH TOÁN MỘT PHẦN";
                case UNPAID -> "CHƯA THANH TOÁN";
            };
            payCell.addElement(new Paragraph("Tình trạng: " + payStatusText, fontLabel));
            payCell.addElement(new Paragraph("Người lập: " + (receipt.getCreatedByName() != null ? receipt.getCreatedByName() : "ADMIN"), fontValue));
            if (receipt.getConfirmedAt() != null) {
                payCell.addElement(new Paragraph("Xác nhận lúc: " + receipt.getConfirmedAt().format(dtfFormatter), fontValue));
            }
            if (receipt.getNote() != null && !receipt.getNote().isBlank()) {
                payCell.addElement(new Paragraph("Ghi chú: " + receipt.getNote(), fontValue));
            }
            infoTable.addCell(payCell);

            document.add(infoTable);

            // 4. Bảng nguyên liệu chi tiết
            PdfPTable itemsTable = new PdfPTable(7);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{6, 16, 32, 9, 11, 13, 13});
            itemsTable.setSpacingAfter(10);

            // Table headers
            String[] headers = {"STT", "Mã NL", "Tên Nguyên Liệu", "ĐVT", "Số Lượng", "Đơn Giá", "Thành Tiền"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, fontTableHeader));
                cell.setBackgroundColor(new Color(180, 83, 9)); // Amber-700
                cell.setPadding(6);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                cell.setBorderColor(new Color(146, 64, 14));
                itemsTable.addCell(cell);
            }

            int idx = 1;
            for (StockReceiptItem item : receipt.getItems()) {
                Color rowBg = (idx % 2 == 0) ? new Color(254, 252, 248) : Color.WHITE;

                // STT
                PdfPCell c1 = new PdfPCell(new Phrase(String.valueOf(idx), fontTableCell));
                c1.setHorizontalAlignment(Element.ALIGN_CENTER);
                c1.setBackgroundColor(rowBg);
                c1.setPadding(5);
                c1.setBorderColor(new Color(229, 231, 235));
                itemsTable.addCell(c1);

                // Mã NL
                PdfPCell c2 = new PdfPCell(new Phrase(item.getIngredient() != null ? item.getIngredient().getCode() : "—", fontTableCell));
                c2.setBackgroundColor(rowBg);
                c2.setPadding(5);
                c2.setBorderColor(new Color(229, 231, 235));
                itemsTable.addCell(c2);

                // Tên NL
                PdfPCell c3 = new PdfPCell(new Phrase(item.getIngredient() != null ? item.getIngredient().getName() : "—", fontTableCellBold));
                c3.setBackgroundColor(rowBg);
                c3.setPadding(5);
                c3.setBorderColor(new Color(229, 231, 235));
                itemsTable.addCell(c3);

                // ĐVT
                PdfPCell c4 = new PdfPCell(new Phrase(item.getUnit(), fontTableCell));
                c4.setHorizontalAlignment(Element.ALIGN_CENTER);
                c4.setBackgroundColor(rowBg);
                c4.setPadding(5);
                c4.setBorderColor(new Color(229, 231, 235));
                itemsTable.addCell(c4);

                // Số lượng
                PdfPCell c5 = new PdfPCell(new Phrase(qtyFormat.format(item.getQuantity()), fontTableCellBold));
                c5.setHorizontalAlignment(Element.ALIGN_RIGHT);
                c5.setBackgroundColor(rowBg);
                c5.setPadding(5);
                c5.setBorderColor(new Color(229, 231, 235));
                itemsTable.addCell(c5);

                // Đơn giá
                PdfPCell c6 = new PdfPCell(new Phrase(vndFormat.format(item.getUnitPrice()), fontTableCell));
                c6.setHorizontalAlignment(Element.ALIGN_RIGHT);
                c6.setBackgroundColor(rowBg);
                c6.setPadding(5);
                c6.setBorderColor(new Color(229, 231, 235));
                itemsTable.addCell(c6);

                // Thành tiền
                PdfPCell c7 = new PdfPCell(new Phrase(vndFormat.format(item.getLineTotal()), fontTableCellBold));
                c7.setHorizontalAlignment(Element.ALIGN_RIGHT);
                c7.setBackgroundColor(rowBg);
                c7.setPadding(5);
                c7.setBorderColor(new Color(229, 231, 235));
                itemsTable.addCell(c7);

                idx++;
            }

            document.add(itemsTable);

            // 5. Tổng kết chi phí phiếu nhập
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(45);
            summaryTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.setWidths(new float[]{55, 45});
            summaryTable.setSpacingAfter(25);

            addSummaryRow(summaryTable, "Tổng tiền hàng:", vndFormat.format(receipt.getTotalAmount()), fontTotalLabel, fontTotalValue);
            addSummaryRow(summaryTable, "Đã thanh toán:", vndFormat.format(receipt.getAmountPaid()), fontLabel, fontTableCellBold);
            addSummaryRow(summaryTable, "Còn phải trả:", vndFormat.format(receipt.getRemainingAmount()), fontTotalLabel, fontTotalValue);

            document.add(summaryTable);

            // 6. Khu vực chữ ký 2 bên
            PdfPTable signTable = new PdfPTable(2);
            signTable.setWidthPercentage(100);
            signTable.setWidths(new float[]{50, 50});
            signTable.setKeepTogether(true);

            PdfPCell signNcc = new PdfPCell();
            signNcc.setBorder(Rectangle.NO_BORDER);
            signNcc.setHorizontalAlignment(Element.ALIGN_CENTER);
            Paragraph pSignNccTitle = new Paragraph("ĐẠI DIỆN NHÀ CUNG CẤP", fontSignTitle);
            pSignNccTitle.setAlignment(Element.ALIGN_CENTER);
            Paragraph pSignNccNote = new Paragraph("(Ký, ghi rõ họ tên)", fontSignNote);
            pSignNccNote.setAlignment(Element.ALIGN_CENTER);
            signNcc.addElement(pSignNccTitle);
            signNcc.addElement(pSignNccNote);
            Paragraph pSpace1 = new Paragraph("\n\n\n");
            signNcc.addElement(pSpace1);
            Paragraph pNccName = new Paragraph(receipt.getSupplier() != null ? receipt.getSupplier().getName() : "", fontValue);
            pNccName.setAlignment(Element.ALIGN_CENTER);
            signNcc.addElement(pNccName);
            signTable.addCell(signNcc);

            PdfPCell signHost = new PdfPCell();
            signHost.setBorder(Rectangle.NO_BORDER);
            signHost.setHorizontalAlignment(Element.ALIGN_CENTER);
            Paragraph pSignHostTitle = new Paragraph("NGƯỜI LẬP / THỦ KHO NHẬN HÀNG", fontSignTitle);
            pSignHostTitle.setAlignment(Element.ALIGN_CENTER);
            Paragraph pSignHostNote = new Paragraph("(Ký, ghi rõ họ tên)", fontSignNote);
            pSignHostNote.setAlignment(Element.ALIGN_CENTER);
            signHost.addElement(pSignHostTitle);
            signHost.addElement(pSignHostNote);
            Paragraph pSpace2 = new Paragraph("\n\n\n");
            signHost.addElement(pSpace2);
            Paragraph pHostName = new Paragraph(receipt.getConfirmedByName() != null ? receipt.getConfirmedByName() : receipt.getCreatedByName(), fontValue);
            pHostName.setAlignment(Element.ALIGN_CENTER);
            signHost.addElement(pHostName);
            signTable.addCell(signHost);

            document.add(signTable);

        } catch (DocumentException ex) {
            throw new BusinessValidationException("Lỗi tạo tài liệu PDF phiếu nhập: " + ex.getMessage());
        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }

        return baos.toByteArray();
    }

    private void addSummaryRow(PdfPTable table, String label, String value, Font fLabel, Font fValue) {
        PdfPCell cLabel = new PdfPCell(new Phrase(label, fLabel));
        cLabel.setBorder(Rectangle.NO_BORDER);
        cLabel.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cLabel.setPadding(3);
        table.addCell(cLabel);

        PdfPCell cVal = new PdfPCell(new Phrase(value, fValue));
        cVal.setBorder(Rectangle.NO_BORDER);
        cVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cVal.setPadding(3);
        table.addCell(cVal);
    }
}
