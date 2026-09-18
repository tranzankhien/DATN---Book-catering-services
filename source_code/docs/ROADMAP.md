# Lộ trình Phát triển Dự án BanquetHub (Project Roadmap)

Tài liệu này theo dõi tiến độ triển khai dự án **BanquetHub (MVP)** bám sát tài liệu đặc tả yêu cầu **`docs/SRS_MVP.docx` (`SRS-PARTY-001`)**.

---

## Tổng quan Tiến độ

| Phase | Hạng mục chính | Trạng thái | Mã FR / BR trọng tâm |
|-------|---------------|------------|----------------------|
| **Phase 1** | Thiết lập nền tảng, PostgreSQL 17, Auth (JWT/RBAC), Danh mục món & Định lượng công thức | **Đã hoàn thành** | `FR-AUT-01`, `FR-AUT-03`, `FR-CAT-01`, `FR-CAT-02`, `FR-REC-01`, `FR-REC-02`, `FR-INV-01`, `BR-01`–`BR-03` |
| **Phase 2** | Quản lý kho, nhà cung cấp, nhập hàng, giá vốn bình quân và xuất PDF phiếu nhập | Kế hoạch tiếp theo | `FR-SUP-01`–`FR-SUP-03`, `FR-INV-02`, `FR-INV-03`, `FR-INV-05`, `FR-INV-06`, `BR-06`, `BR-07`, `BR-11` |
| **Phase 3** | Thực đơn mẫu, tạo thực đơn, đặt tiệc, giữ tồn 15 phút và quản lý đơn hàng | Chờ triển khai | `FR-CAT-03`, `FR-CAT-04`, `FR-REC-03`, `FR-ORD-01`–`FR-ORD-05`, `FR-PAY-04`, `BR-01`, `BR-02`, `BR-04` |
| **Phase 4** | Tích hợp VNPAY Sandbox, trừ kho một lần khi thanh toán, gửi email xác nhận | Chờ triển khai | `FR-PAY-01`–`FR-PAY-03`, `FR-INV-04`, `FR-NOT-01`, `FR-NOT-02`, `BR-05`, `BR-08`, `BR-12` |
| **Phase 5** | Tích hợp Gemini API gợi ý tối đa 03 phương án thực đơn từ catalog | Chờ triển khai | `FR-AI-01`–`FR-AI-04`, `NFR-07` |
| **Phase 6** | Quản lý nhân viên, chấm công theo ngày, phụ cấp/khấu trừ và bảng lương tháng | Chờ triển khai | `FR-EMP-01`, `FR-HR-01`–`FR-HR-05`, `BR-10`, `BR-11` |
| **Phase 7** | Dashboard doanh thu, giá vốn, chi phí vận hành, lợi nhuận tạm tính, dòng tiền & nghiệm thu AT-01..AT-20 | Chờ triển khai | `FR-RPT-01`–`FR-RPT-07`, `BR-09`, `AT-01`–`AT-20` |

---

## Chi tiết các Phase tiếp theo

### Phase 2: Quản lý kho, nhà cung cấp, nhập hàng, giá vốn và xuất PDF
- Quản lý danh bạ Nhà cung cấp (`Supplier`).
- Tạo và xác nhận Phiếu nhập nguyên liệu (`StockReceipt`, `ReceiptLine`), tăng tồn đúng một lần và cập nhật đơn giá vốn bình quân gia quyền di động (`BR-07`).
- Theo dõi trạng thái thanh toán NCC (`Chưa trả` / `Đã trả`) phục vụ tính dòng tiền (`FR-SUP-02`).
- Phiếu điều chỉnh tồn kho có lý do (`StockMovement`, `FR-INV-05`) và cảnh báo tồn thấp (`FR-INV-06`).
- Xuất file PDF phiếu nhập kho theo yêu cầu (`FR-SUP-03`).

### Phase 3: Thực đơn mẫu, tạo thực đơn, đặt tiệc, giữ tồn 15 phút và quản lý đơn
- Quản trị Thực đơn mẫu (`Menu`, `MenuItem`) cho 01 bàn tiệc (`FR-CAT-04`).
- Khách hàng tự xây dựng hoặc chỉnh sửa thực đơn cho 01 bàn và chọn số bàn (`FR-CAT-03`).
- Kiểm tra khả năng phục vụ theo tồn khả dụng (`Tồn vật lý − Lượng đang giữ tạm hợp lệ`, `FR-REC-03`, `BR-04`).
- Tạo đơn đặt tiệc (`Order`, `OrderLine`, `OrderStockSnapshot`), chốt bản sao giá bán và định lượng nguyên liệu tại thời điểm đặt, giữ tồn tạm trong 15 phút (`StockHold`, `FR-PAY-04`).
- Luồng xử lý tiến độ đơn cho Nhân viên (`ROLE_EMPLOYEE`) và Admin: `Đã ghi nhận` → `Đang chuẩn bị` → `Hoàn thành` (`FR-ORD-03`–`FR-ORD-05`).

### Phase 4: Tích hợp VNPAY Sandbox, trừ kho khi thanh toán, email xác nhận
- Tạo URL thanh toán 100% giá trị đơn qua VNPAY Sandbox (`FR-PAY-01`).
- Backend xác thực chữ ký HMAC-SHA512, số tiền, mã giao dịch (`PaymentTransaction`, `FR-PAY-02`).
- Chống xử lý trùng callback (idempotency): cập nhật trạng thái đơn sang `Đã thanh toán`, trừ kho nguyên liệu đúng một lần theo snapshot định lượng và ghi nhận giá vốn xuất kho (`FR-PAY-03`, `FR-INV-04`, `BR-05`).
- Xử lý trường hợp callback đến muộn sau 15 phút khi thiếu tồn: đánh dấu `Đã thanh toán – cần xử lý`, không trừ âm kho.
- Gửi email xác nhận đơn hàng qua SMTP và lưu nhật ký `EmailLog` (`FR-NOT-01`, `BR-12`).

### Phase 5: Gemini API gợi ý thực đơn
- Khách hàng nhập mô tả bối cảnh tiệc, khẩu vị và ngân sách dự kiến cho 01 bàn (`FR-AI-01`).
- Backend gọi Gemini API để đề xuất tối đa 03 phương án thực đơn chỉ sử dụng món `ACTIVE` trong hệ thống (`FR-AI-02`).
- Lọc bỏ món không hợp lệ, tính lại giá thực tế từ CSDL (`FR-AI-03`) và cho phép khách hàng chỉnh sửa trước khi đặt tiệc (`FR-AI-04`).

### Phase 6: Quản lý nhân viên, chấm công, bảng lương
- Quản lý hồ sơ nhân viên và mức lương cố định tháng (`Employee`, `FR-EMP-01`).
- Chấm công theo ngày (`0`, `0.5`, `1` công), chống trùng bản ghi cùng nhân viên/ngày (`Attendance`, `FR-HR-01`).
- Quản lý khoản phụ cấp và khấu trừ theo tháng (`PayrollAdjustment`, `FR-HR-02`).
- Tính bảng lương tháng (`Lương cố định × Tổng công / Công chuẩn + Phụ cấp − Khấu trừ`, mặc định công chuẩn 26, làm tròn VND) và ghi nhận thanh toán lương (`Payroll`, `SalaryPayment`, `FR-HR-03`, `FR-HR-04`, `BR-10`).

### Phase 7: Dashboard, chi phí, báo cáo và nghiệm thu theo SRS
- Quản lý khoản chi phí vận hành khác nhập thủ công (`OperatingExpense`, `FR-RPT-04`).
- Dashboard tách biệt rõ hai chỉ số:
  - **Lợi nhuận tạm tính** = Doanh thu đơn đã thanh toán − Giá vốn nguyên liệu xuất kho − Chi phí lương theo kỳ − Chi phí vận hành khác (`FR-RPT-05`, `BR-09`).
  - **Dòng tiền thu/chi** = Tiền thu từ đơn đã trả − Tiền NCC đã chi − Lương đã trả − Chi phí vận hành đã chi (`FR-RPT-06`).
- Kiểm thử nghiệm thu toàn diện 20 kịch bản `AT-01` đến `AT-20`.
