# Lộ trình Phát triển Dự án BanquetHub (Project Roadmap)

Tài liệu này theo dõi tiến độ triển khai dự án **BanquetHub (MVP)** bám sát tài liệu đặc tả yêu cầu **`docs/SRS_MVP.docx` (`SRS-PARTY-001`)**.

---

## Tổng quan Tiến độ

| Phase | Hạng mục chính | Trạng thái | Mã FR / BR trọng tâm |
|-------|---------------|------------|----------------------|
| **Phase 1** | Thiết lập nền tảng, PostgreSQL 17, Auth (JWT/RBAC), Danh mục món & Định lượng công thức | **Đã hoàn thành** | `FR-AUT-01`, `FR-AUT-03`, `FR-CAT-01`, `FR-CAT-02`, `FR-REC-01`, `FR-REC-02`, `FR-INV-01`, `BR-01`–`BR-03` |
| **Phase 2** | Quản lý kho, nhà cung cấp, nhập hàng, giá vốn bình quân di động và xuất PDF phiếu nhập | **Đã hoàn thành** | `FR-SUP-01`–`FR-SUP-03`, `FR-INV-02`, `FR-INV-03`, `FR-INV-05`, `FR-INV-06`, `BR-06`, `BR-07`, `BR-11` |
| **Phase 3** | Thực đơn mẫu, tạo thực đơn, đặt tiệc, giữ tồn 15 phút và quản lý đơn hàng | **Đã hoàn thành** | `FR-CAT-03`, `FR-CAT-04`, `FR-REC-03`, `FR-ORD-01`–`FR-ORD-05`, `FR-PAY-04`, `BR-01`–`BR-16` |
| **Phase 4** | Tích hợp SePay/VNPay Sandbox, trừ kho một lần khi thanh toán, chốt COGS, gửi email | **Đã hoàn thành** | `FR-PAY-01`–`FR-PAY-03`, `FR-INV-04`, `FR-NOT-01`, `FR-NOT-02`, `BR-05`, `BR-08`, `BR-12` |
| **Phase 5** | Tích hợp Gemini API gợi ý tối đa 03 phương án thực đơn từ catalog & fallback | **Đã hoàn thành** | `FR-AI-01`–`FR-AI-04`, `NFR-07` |
| **Phase 6** | Quản lý nhân sự, chấm công theo ngày, phụ cấp/khấu trừ, bảng lương & cổng nhân viên | **Đã hoàn thành** | `FR-EMP-01`, `FR-HR-01`–`FR-HR-05`, `BR-10`, `BR-11` |
| **Phase 7** | Dashboard kinh doanh, phân tích doanh thu, chi phí, lợi nhuận, dòng tiền & xuất CSV | **Đã hoàn thành** | `FR-RPT-01`–`FR-RPT-07`, `BR-09`, `AT-01`–`AT-20` |

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

### Phase 4: Tích hợp SePay Sandbox, trừ kho một lần khi thanh toán, gửi email xác nhận (Kế hoạch tiếp theo)
- Tích hợp cổng thanh toán trực tuyến SePay Sandbox (`FR-PAY-01`–`FR-PAY-03`).
- Webhook IPN xử lý kết quả thanh toán từ SePay an toàn, xác thực chữ ký Secret Key IPN.
- Trừ kho vật lý thực tế (`current_stock = current_stock - quantity`) và ghi nhận `StockMovement` loại `EXPORT` sau khi thanh toán thành công (`FR-INV-04`, `BR-05`).
- Gửi email hóa đơn điện tử xác nhận đặt tiệc qua SMTP/SendGrid (`FR-NOT-01`, `FR-NOT-02`).


## Phase 4
Phase 4 triển khai SePay Sandbox, xuất kho, email và tiến độ phục vụ. Xác nhận giao dịch trực tiếp cần cấu hình merchant Sandbox và HTTPS IPN. Xem [luồng thanh toán](PAYMENT_FLOW.md).

## Phase 5 – AI Menu Recommendation System (Hoàn thành)
- Tích hợp Google Gemini AI API (`gemini-flash-lite-latest`) với định dạng Structured Output JSON Schema.
- Cơ chế bảo vệ giá bán: Backend ghi đè giá bán thực từ PostgreSQL, tuyệt đối không tin giá do AI sinh ra.
- Kiểm tra nguyên liệu tồn kho độc lập: Tính lượng tiêu hao thực tế từ công thức món và đối chiếu với tồn khả dụng (`physicalStock - activeReservedStock`).
- Giới hạn tần suất (Rate Limiting): 60 lượt / giờ / user (hỗ trợ GEMINI_MAX_REQUESTS_PER_HOUR hoặc AI_MAX_REQUESTS_PER_USER), bảo vệ nguyên tử chống race condition và ghi nhận nhật ký kỹ thuật vào bảng `ai_recommendation_usage`.
- Cơ chế Fallback linh hoạt (`source = RULE_BASED`): Tự động kích hoạt thuật toán cân bằng dinh dưỡng và ngân sách khi AI ngoại tuyến hoặc quá tải.
- Giao diện người dùng `/ai-menu` sang trọng, hiện đại, tích hợp chuyển giao thực đơn vào Menu Builder để tiếp tục quy trình đặt tiệc và thanh toán.


---

## Phase 6 – Quản lý Nhân sự, Chấm công, Bảng lương & Chi trả (Hoàn thành)
- **Hồ sơ nhân sự (Employee Directory)**:
  - CRUD hồ sơ nhân sự, tự sinh mã nhân viên chuẩn hóa (`NV-XXXX`), quản lý vị trí chuyên môn, ngày vào làm và mức lương cơ bản hợp đồng.
  - Liên kết 1-1 với tài khoản người dùng `ROLE_EMPLOYEE`. Bảo toàn lịch sử nhân sự `INACTIVE`.
- **Bảng chấm công hàng ngày (Daily Attendance)**:
  - Chấm công chi tiết từng ngày trong tháng theo 3 trạng thái chuẩn hóa: `PRESENT` (1.0 công), `HALF_DAY` (0.5 công), `ABSENT` (0.0 công), ngày chưa chấm (0.0 công).
  - Hỗ trợ chấm công đơn lẻ và chấm công hàng loạt theo ngày.
  - Ma trận chấm công toàn viện theo tháng, tự động tính tổng công thực tế tích lũy.
  - Khóa chấm công bất biến chống sửa đổi một khi kỳ tính lương của tháng đã được chốt sổ (`FINALIZED` hoặc `CLOSED`).
- **Kỳ tính lương & Động cơ tính lương chuẩn xác (Payroll Engine)**:
  - Chu kỳ tính lương theo tháng (`year`, `month`), cấu hình số ngày công chuẩn (mặc định 26.0 ngày).
  - Trạng thái vòng đời kỳ lương rõ ràng: `DRAFT` (Đang tính toán) -> `FINALIZED` (Đã chốt sổ) -> `CLOSED` (Đã đóng).
  - Động cơ tính toán lương tự động:
    - `Lương theo công = Round(Lương cơ bản * Số công thực tế / Số công chuẩn, 0, HALF_UP)`
    - `Lương thực lĩnh = Lương theo công + Tổng phụ cấp - Tổng khấu trừ`
  - Quản lý các khoản phụ cấp (`ALLOWANCE`) và khấu trừ (`DEDUCTION`) linh hoạt trong giai đoạn `DRAFT`.
  - Bảng dự toán tính lương (Preview) hiển thị chi tiết từng nhân sự kèm cờ cảnh báo (công vượt công chuẩn, lương âm).
  - Chốt sổ tạo snapshot bất biến (`payrolls`) lưu giữ toàn bộ thông số tính lương tại thời điểm chốt.
- **Theo dõi chi trả lương (Salary Payment Tracking)**:
  - Ghi nhận giải ngân tiền lương qua 2 hình thức: `CASH` (Tiền mặt) và `BANK_TRANSFER` (Chuyển khoản).
  - Nguyên tắc chi trả toàn bộ `netSalary` một lần duy nhất, chuyển trạng thái sang `PAID`.
  - Cơ chế chống chi trùng lặp triệt để bằng khóa bi quan `SELECT FOR UPDATE` và ràng buộc CSDL `UNIQUE(payroll_id)`.
  - Sổ cái nhật ký chi trả lương (`salary_payments`) lưu trữ thông tin ngày chi, phương thức, người ghi nhận và ghi chú.
- **Cổng Tự phục vụ của Nhân viên (Employee Self-Service)**:
  - Nhân viên đăng nhập xem lịch sử chấm công và tổng công tháng của chính mình.
  - Nhân viên xem danh sách các phiếu lương chính thức (Payslip) với định dạng thẻ chuyên nghiệp, minh bạch các khoản thu nhập.
  - Cơ chế kiểm soát an toàn tuyệt đối: Nhân viên chỉ có thể xem dữ liệu của chính mình, chặn đứng mọi hành vi sửa ID trên URL hoặc API.
- **Tích hợp Dashboard Phase 7**:
  - API tổng hợp tài chính lương `/api/v1/admin/payrolls/summary` cung cấp các chỉ số: Tổng chi phí lương đã chốt, Tổng tiền đã chi trả, Công nợ lương chưa thanh toán, Số nhân sự đang hoạt động và biểu đồ các tháng.
- **Kiểm thử & Chất lượng**:
  - 39 / 39 test cases tự động Phase 6 đạt tỷ lệ **100% PASS**.
  - Toàn bộ suite hồi quy 139 / 139 test cases backend (Phase 1 đến Phase 6) đều **100% PASS**.
  - Frontend typecheck và build production: **0 lỗi**.

---

## Phase 7 – Báo cáo Quản trị, Phân tích Doanh thu, Chi phí & Lợi nhuận (Hoàn thành)
- **Bảng điều khiển kinh doanh trung tâm (Admin Dashboard)**:
  - Doanh thu đơn đã thanh toán theo ngày thanh toán (loại trừ đơn nháp, đơn hủy, đơn hết hạn).
  - Giá vốn nguyên liệu tiêu hao (COGS) dựa trên snapshot thực tế khi xuất kho đơn hàng.
  - Lợi nhuận gộp và biên lợi nhuận gộp theo kỳ chọn lọc.
  - Lợi nhuận ước tính (EBITDA ước tính) sau khi trừ chi phí lương nội bộ đã chốt và chi phí vận hành khác.
  - Giá trị đơn trung bình (AOV), biểu đồ xu hướng doanh thu theo ngày/tháng, cơ cấu chi phí, cảnh báo tồn kho và công nợ.
- **Quản lý Chi phí Vận hành (Operating Expenses)**:
  - CRUD ghi nhận chi phí ngoài kho và ngoài lương: mặt bằng, điện nước, internet, marketing, sửa chữa, vệ sinh.
  - Lọc theo danh mục và kỳ phát sinh chi phí.
- **Hệ thống Báo cáo Đối soát Chuyên sâu**:
  - Báo cáo chi tiết doanh thu và danh sách đơn đã thanh toán (`/admin/reports/revenue`).
  - Báo cáo kho, tiêu hao nguyên liệu và công nợ mua hàng nhà cung cấp (`/admin/reports/inventory`).
  - Báo cáo quỹ lương nhân sự và giải ngân chi trả (`/admin/reports/payroll`).
  - Báo cáo Lợi nhuận gộp & ước tính theo tháng (`/admin/reports/profit`).
  - Báo cáo Dòng tiền vào/ra đã ghi nhận (`/admin/reports/cashflow`).
  - Xuất dữ liệu báo cáo sang tệp CSV định dạng chuẩn Excel với UTF-8 BOM.
- **Kiểm thử & Chất lượng**:
  - 10 / 10 test cases integration Phase 7 đạt tỷ lệ **100% PASS**.
  - Tổng cộng toàn bộ suite hệ thống: **157 / 157 test cases** backend đạt tỷ lệ **100% PASS**.
  - Frontend TypeScript và Vite build production: **0 lỗi**.
