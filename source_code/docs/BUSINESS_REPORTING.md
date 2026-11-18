# BanquetHub Phase 7 – Business Reporting & Financial Analytics

## 1. Tổng quan & Tôn chỉ tài chính (Financial Principles)

Phase 7 hoàn thiện hệ thống đo lường hiệu quả kinh doanh, phân tích doanh thu, kiểm soát giá vốn nguyên liệu, quản lý chi phí vận hành và tính toán lợi nhuận quản trị cho nền tảng yến tiệc BanquetHub.

### 4 Nguyên tắc tài chính bất biến:
1. **Doanh thu thực thu (Paid Revenue - A)**:
   - Chỉ ghi nhận từ các đơn đặt tiệc có trạng thái thanh toán `PAID` và có `paid_at` nằm trong khoảng thời gian lọc `[startDate, endDate + 1 ngày)`.
   - Tuyệt đối không tính doanh thu từ đơn hàng `PENDING_PAYMENT`, `PAYMENT_EXPIRED`, `CANCELLED` hoặc chưa giải quyết đối soát.
   - Idempotent: Khi webhook/IPN SePay/VNPAY gửi nhiều lần cho cùng một giao dịch, chỉ cập nhật `orders.paid_at` một lần duy nhất theo giao dịch thành công đầu tiên.

2. **Giá vốn nguyên liệu tiêu hao (COGS / Material Cost - B)**:
   - Nguồn dữ liệu: Bảng `order_ingredient_consumptions`.
   - Mỗi lần đơn đặt tiệc chuyển sang `PAID`, hệ thống lưu snapshot đơn giá vốn bình quân di động (`unit_cost_snapshot`) và thành tiền tiêu hao (`total_cost = quantity_used * unit_cost_snapshot`).
   - Tuyệt đối **không dùng đơn giá vốn hiện tại** để tính lại giá vốn của các đơn hàng trong quá khứ.
   - Tuyệt đối **không cộng cả tiền nhập nguyên liệu (Purchase Amount) và giá vốn tiêu hao (COGS)** vào cùng công thức chi phí tính lợi nhuận. Tiền nhập hàng làm tăng tài sản tồn kho, chỉ khi xuất nguyên liệu nấu tiệc mới tạo thành chi phí giá vốn (B).

3. **Chi phí lương nội bộ chính thức (Internal Payroll Cost - C)**:
   - Nguồn dữ liệu: Bảng `payrolls` kết hợp `payroll_periods`.
   - Chỉ tính tổng lương thực lĩnh (`net_salary`) của các kỳ tính lương đã được quản trị viên duyệt chốt sổ chính thức (`FINALIZED` hoặc `CLOSED`).
   - Bảng dự thảo lương (`DRAFT`) tuyệt đối không được đưa vào báo cáo chi phí lợi nhuận chính thức.

4. **Chi phí vận hành khác (Operating Expenses - D)**:
   - Nguồn dữ liệu: Bảng `operating_expenses` (Module MVP mới).
   - Phân loại: Mặt bằng (`RENT`), Điện nước/Internet (`UTILITIES`), Tiếp thị (`MARKETING`), Bảo trì thiết bị (`MAINTENANCE`), Văn phòng phẩm (`OFFICE_SUPPLIES`), Thuế/Phí (`TAX_FEE`), Khác (`OTHER`).
   - Phân bổ vào chi phí theo ngày phát sinh thực tế (`incurred_date`), không phụ thuộc vào việc đã thanh toán tiền hay đang nợ tiền (`UNPAID`).

---

## 2. Công thức đo lường cốt lõi

### 2.1 Lợi nhuận gộp (Gross Profit)
$$\text{Lợi nhuận gộp} = A - B$$
$$\text{Biên lợi nhuận gộp (\%)} = \frac{A - B}{A} \times 100\%$$

### 2.2 Lợi nhuận ước tính quản trị (Estimated Net Profit)
$$\text{Lợi nhuận ước tính} = A - B - C - D$$
$$\text{Tỷ suất lợi nhuận ròng (\%)} = \frac{A - B - C - D}{A} \times 100\%$$
- *Lưu ý*: Hệ thống hỗ trợ đầy đủ số âm (khi chi phí vượt doanh thu trong tháng thấp điểm hoặc tháng đầu cơ sở mới đi vào hoạt động).

### 2.3 Phân biệt Dòng tiền (Cash Flow) vs Lợi nhuận (Profit)
| Chỉ tiêu | Lợi nhuận (Profit Report) | Dòng tiền (Cash Flow Report) |
| :--- | :--- | :--- |
| **Bản chất** | Kế toán dồn tích (Accrual basis) | Thu/Chi thực tế xuất nhập quỹ (Cash basis) |
| **Nguyên liệu** | Tính theo Giá vốn tiêu hao đơn hàng (`order_ingredient_consumptions.total_cost`) | Tính theo Tiền thực tế đã thanh toán cho NCC (`supplier_payments.amount`) |
| **Tiền lương** | Tính theo Lương thực lĩnh đã chốt số kỳ lương (`payrolls.net_salary`) | Tính theo Tiền lương thực trả bằng chuyển khoản/tiền mặt (`salary_payments.amount`) |
| **Vận hành** | Tính theo Chi phí phát sinh (`operating_expenses.incurred_date`) | Chỉ tính khi khoản chi đã thanh toán (`payment_status = 'PAID'`) |

---

## 3. Danh mục API Endpoints

### 3.1 Bảng điều khiển (Admin Dashboard)
- `GET /api/v1/admin/dashboard/overview?startDate=...&endDate=...`: Tổng hợp 8 KPI chính, tăng trưởng kỳ trước, định giá kho và công nợ.
- `GET /api/v1/admin/dashboard/revenue-chart?startDate=...&endDate=...&groupBy=DAY|WEEK|MONTH`: Chuỗi thời gian doanh thu.
- `GET /api/v1/admin/dashboard/order-status-stats?startDate=...&endDate=...`: Phân bố trạng thái đơn hàng.
- `GET /api/v1/admin/dashboard/cost-structure?startDate=...&endDate=...`: Tỷ lệ cơ cấu chi phí (NVL, Lương, Vận hành).
- `GET /api/v1/admin/dashboard/alerts`: Cảnh báo kho sắp hết và cảnh báo vận hành.

### 3.2 Báo cáo chuyên sâu
- `GET /api/v1/admin/reports/revenue/summary`: Tóm tắt doanh thu, AOV, tăng trưởng.
- `GET /api/v1/admin/reports/revenue/trend`: Xu hướng doanh thu theo chu kỳ.
- `GET /api/v1/admin/reports/revenue/top-dishes`: Top món bán chạy nhất tính theo `quantity_per_table * table_count`.
- `GET /api/v1/admin/reports/revenue/paid-orders`: Danh sách đơn đã thanh toán kèm snapshot giá vốn & lợi nhuận gộp từng đơn.
- `GET /api/v1/admin/reports/inventory/overview`: Tổng giá trị tồn kho, giá trị nhập kho, giá vốn tiêu hao.
- `GET /api/v1/admin/reports/inventory/valuation`: Bảng định giá tồn kho từng nguyên liệu (`current_stock * avg_unit_cost`).
- `GET /api/v1/admin/reports/inventory/supplier-purchases`: Thống kê nhập hàng và công nợ theo nhà cung cấp.
- `GET /api/v1/admin/reports/expenses`: CRUD chi phí vận hành khác.
- `GET /api/v1/admin/reports/payroll/overview`: Tổng quỹ lương chốt, tiền lương đã giải ngân, nợ lương còn lại.
- `GET /api/v1/admin/reports/payroll/monthly-trend`: Xu hướng quỹ lương theo tháng.
- `GET /api/v1/admin/reports/profit`: Báo cáo lợi nhuận $A - B - C - D$ và bảng đối soát từng tháng.
- `GET /api/v1/admin/reports/cash-flow`: Báo cáo dòng tiền thu/chi mô phỏng.

### 3.3 Xuất file CSV (Excel-Compatible)
- `GET /api/v1/admin/reports/export/revenue`
- `GET /api/v1/admin/reports/export/inventory`
- `GET /api/v1/admin/reports/export/expenses`
- `GET /api/v1/admin/reports/export/profit`
- `GET /api/v1/admin/reports/export/cash-flow`
- **Quy chuẩn file CSV**:
  - Đính kèm tiền tố byte UTF-8 BOM (`\uFEFF`) để Microsoft Excel trên Windows/Mac tự động mở hiển thị tiếng Việt có dấu chuẩn xác mà không bị vỡ font.
  - Chống lỗ hổng CSV Injection: Ký tự đầu dòng là `=`, `+`, `-`, `@` được escape an toàn bằng dấu nháy đơn.
  - Trường dữ liệu số giữ nguyên giá trị số (không gắn chữ "đ" hay định dạng phẩy) để hỗ trợ công thức SUM/AVERAGE trong Excel.
