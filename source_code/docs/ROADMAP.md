# Lộ trình Phát triển Dự án BanquetHub (Project Roadmap)

Tài liệu này theo dõi tiến độ triển khai dự án **BanquetHub (MVP)** bám sát tài liệu đặc tả yêu cầu **`docs/SRS_MVP.docx` (`SRS-PARTY-001`)**.

---

## Tổng quan Tiến độ

| Phase | Hạng mục chính | Trạng thái | Mã FR / BR trọng tâm |
|-------|---------------|------------|----------------------|
| **Phase 1** | Thiết lập nền tảng, PostgreSQL 17, Auth (JWT/RBAC), Danh mục món & Định lượng công thức | **Đã hoàn thành** | `FR-AUT-01`, `FR-AUT-03`, `FR-CAT-01`, `FR-CAT-02`, `FR-REC-01`, `FR-REC-02`, `FR-INV-01`, `BR-01`–`BR-03` |
| **Phase 2** | Quản lý kho, nhà cung cấp, nhập hàng, giá vốn bình quân di động và xuất PDF phiếu nhập | **Đã hoàn thành** | `FR-SUP-01`–`FR-SUP-03`, `FR-INV-02`, `FR-INV-03`, `FR-INV-05`, `FR-INV-06`, `BR-06`, `BR-07`, `BR-11` |
| **Phase 3** | Thực đơn mẫu, tạo thực đơn, đặt tiệc, giữ tồn 15 phút và quản lý đơn hàng | **Đã hoàn thành** | `FR-CAT-03`, `FR-CAT-04`, `FR-REC-03`, `FR-ORD-01`–`FR-ORD-05`, `FR-PAY-04`, `BR-01`–`BR-16` |
| **Phase 4** | Tích hợp VNPAY Sandbox, trừ kho một lần khi thanh toán, gửi email xác nhận | Kế hoạch tiếp theo | `FR-PAY-01`–`FR-PAY-03`, `FR-INV-04`, `FR-NOT-01`, `FR-NOT-02`, `BR-05`, `BR-08`, `BR-12` |
| **Phase 5** | Tích hợp Gemini API gợi ý tối đa 03 phương án thực đơn từ catalog | Chờ triển khai | `FR-AI-01`–`FR-AI-04`, `NFR-07` |
| **Phase 6** | Quản lý nhân viên, chấm công theo ngày, phụ cấp/khấu trừ và bảng lương tháng | Chờ triển khai | `FR-EMP-01`, `FR-HR-01`–`FR-HR-05`, `BR-10`, `BR-11` |
| **Phase 7** | Dashboard doanh thu, giá vốn, chi phí vận hành, lợi nhuận tạm tính, dòng tiền & nghiệm thu AT-01..AT-20 | Chờ triển khai | `FR-RPT-01`–`FR-RPT-07`, `BR-09`, `AT-01`–`AT-20` |

---

## Chi tiết các Phase đã hoàn thành & Kế hoạch tiếp theo

### Phase 1: Nền tảng, CSDL, Auth, Danh mục & Công thức (Hoàn thành)
- Spring Boot 3.5.16, Java 21/24, PostgreSQL 17, Vite React TypeScript, Tailwind CSS.
- JWT Authentication, BCrypt băm mật khẩu, phân quyền RBAC (`ROLE_USER`, `ROLE_EMPLOYEE`, `ROLE_ADMIN`).
- Quản lý danh mục món ăn, công thức định lượng nguyên liệu chuẩn hóa cho 01 phần, khóa đơn vị kho (`BR-02`, `BR-03`).
- 8/8 test cases integration vượt qua 100%.

### Phase 2: Quản lý kho, nhà cung cấp, nhập hàng, giá vốn di động và xuất PDF (Hoàn thành)
- **Module 1 – Quản lý nguyên liệu & Tồn kho**: Mở rộng bảng `ingredients` với `version` (optimistic lock), `avg_unit_cost` (NUMERIC(18,4)), xem chi tiết nguyên liệu, danh sách món dùng, lịch sử biến động, cảnh báo tồn thấp (`FR-INV-06`), chặn xóa vĩnh viễn khi đã có giao dịch kho hoặc công thức món.
- **Module 2 – Quản lý nhà cung cấp**: Bảng `suppliers`, sinh mã `NCC-xxxxxx`, chặn trùng số điện thoại (`409 Conflict`), tìm kiếm theo tên/sđt, xem các phiếu nhập liên quan, tổng tiền đã nhập (`FR-SUP-01`, `FR-SUP-02`).
- **Module 3 – Phiếu nhập nguyên liệu**: Bảng `stock_receipts` và `stock_receipt_items`, tự sinh mã `PN-xxxxxx`, tự tính thành tiền từng dòng và tổng tiền phiếu, lưu Nháp (`DRAFT`) hoặc Xác nhận (`CONFIRMED`). Xác nhận tăng tồn đúng 1 lần, chống xác nhận 2 lần bằng unique index idempotency, chặn sửa/xóa phiếu đã xác nhận (`BR-06`, `BR-07`).
- **Module 4 – Xuất PDF phiếu nhập**: Thư viện OpenPDF 2.0.3 kết hợp bộ font Unicode Noto Sans (SIL Open Font License) hiển thị tiếng Việt có dấu chuẩn xác khổ A4, bố cục bảng biểu chuyên nghiệp, chữ ký và đầy đủ thông tin tài chính (`FR-SUP-03`).
- **Module 5 – Tồn kho & Sổ biến động**: Bảng `stock_movements` (Audit log đầy đủ: tồn trước/sau, giá vốn trước/sau, chứng từ tham chiếu, tác nhân thực hiện) và `stock_adjustments` (biên bản điều chỉnh kiểm kê thủ công, chặn làm tồn âm `400 Bad Request`, `FR-INV-05`).
- **Module 6 – Giá vốn bình quân di động liên hoàn**: Công thức chuẩn: `newCost = (oldStock * oldCost + importQty * importPrice) / (oldStock + importQty)`.
- **Giao diện Admin UI**: 5 trang quản trị hoàn chỉnh tích hợp Sidebar thông minh (Pinned & Hover to expand).
- **Kiểm thử**: 18/18 test cases integration Phase 2 vượt qua 100% (tổng cộng 26/26 tests hệ thống pass).

---

### Phase 3: Thực đơn mẫu, tạo thực đơn, đặt tiệc, giữ tồn 15 phút và quản lý đơn (Hoàn thành)
- **Thực đơn mẫu & Catalog**: Quản trị thực đơn mẫu (`Menu`, `MenuItem`) cho 01 bàn tiệc (`FR-CAT-04`), seed 3 set menu truyền thống (`MN-001`, `MN-002`, `MN-003`).
- **Interactive Menu Builder**: Khách hàng tự phối hoặc tùy biến thực đơn từ món ăn catalog, tăng giảm số phần trên bàn tiệc và quy mô số bàn tiệc (`FR-CAT-03`).
- **Tính toán tài chính & kiểm tra tồn kho realtime**: Client gọi API preview để tính toán giá mỗi bàn, tổng tiền tiệc và nhu cầu nguyên liệu theo công thức `demand = total_portion * recipe_qty`, đối chiếu với tồn khả dụng `availableStock = physicalStock - activeReservedStock` (`FR-REC-03`, `BR-01`–`BR-06`).
- **Khóa giữ kho 15 phút (Stock Reservation)**: Đặt tiệc tạo `StockReservation` (trạng thái `PENDING`, `paymentExpiresAt = now + 15m`). Khóa bi quan `PESSIMISTIC_WRITE` có sắp xếp ID nguyên liệu để chống overselling và Deadlock tuyệt đối dưới tải cao (`BR-14`).
- **Bảo toàn lịch sử (Historical Immutability)**: Chụp ảnh bất biến đơn giá món và tên món tại thời điểm đặt (`dish_name_snapshot`, `unit_price_snapshot`, `BR-10`).
- **Chống trùng lặp (Idempotency)**: Header / Body `Idempotency-Key` ngăn chặn tạo trùng lặp đơn hàng khi mạng chập chờn (`BR-13`).
- **Tiến trình quét tự động**: `@Scheduled` quét định kỳ mỗi phút tự động hủy đơn và giải phóng nguyên liệu kho cho các đơn quá hạn 15 phút (`BR-08`).
- **Phân hệ Khách hàng, Admin & Điều phối bếp**:
  - Giao diện Khách hàng: `/menus`, `/menus/:id`, `/menu-builder`, `/checkout`, `/orders/confirmation/:id` (đồng hồ đếm ngược 15 phút), `/my-orders`, `/my-orders/:id`.
  - Giao diện Admin: `/admin/menus`, `/admin/orders`, `/admin/orders/:id`, `/admin/inventory/reservations`.
  - Giao diện Bếp / Điều phối: `/employee/orders`, `/employee/orders/:id`.
- **Kiểm thử**: Toàn bộ 53/53 test cases integration (Phase 1: 8, Phase 2: 23, Phase 3: 22) đạt tỷ lệ vượt qua **100%**. Frontend build production **0 lỗi**.

---

### Phase 4: Tích hợp VNPAY Sandbox, trừ kho một lần khi thanh toán, gửi email xác nhận (Kế hoạch tiếp theo)
- Tích hợp cổng thanh toán trực tuyến VNPAY Sandbox (`FR-PAY-01`–`FR-PAY-03`).
- Webhook IPN xử lý kết quả thanh toán từ VNPAY an toàn, xác thực chữ ký HMAC-SHA512.
- Trừ kho vật lý thực tế (`current_stock = current_stock - quantity`) và ghi nhận `StockMovement` loại `EXPORT` sau khi thanh toán thành công (`FR-INV-04`, `BR-05`).
- Gửi email hóa đơn điện tử xác nhận đặt tiệc qua SMTP/SendGrid (`FR-NOT-01`, `FR-NOT-02`).
