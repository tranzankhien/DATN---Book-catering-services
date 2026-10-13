# Tài liệu REST API BanquetHub

- **Base URL**: `http://localhost:8080/api/v1`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON**: `http://localhost:8080/api-docs`
- **Xác thực**: Header `Authorization: Bearer <accessToken>` cho các API yêu cầu đăng nhập.

---

## 1. Cấu trúc Phản hồi Chuẩn (Standard JSON Response)

### Phản hồi thành công (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Thành công",
  "data": {},
  "timestamp": "2026-11-10T12:30:00+07:00"
}
```

### Phản hồi lỗi (`400`, `401`, `403`, `404`, `409`, `500`)
```json
{
  "success": false,
  "status": 400,
  "error": "VALIDATION_ERROR",
  "message": "Định lượng nguyên liệu cho 01 phần món phải lớn hơn 0",
  "path": "/api/v1/admin/catalog/dishes/1/recipe",
  "validationErrors": {
    "recipeItems[0].quantity": "Định lượng nguyên liệu cho 01 phần món phải lớn hơn 0"
  },
  "timestamp": "2026-11-10T12:30:00+07:00"
}
```

---

## 2. Hệ thống & Health Check

| Phương thức | Endpoint | Quyền | Mô tả |
|-------------|----------|-------|-------|
| `GET` | `/api/v1/health` | Public | Kiểm tra trạng thái API, kết nối PostgreSQL và múi giờ `Asia/Ho_Chi_Minh` |
| `GET` | `/actuator/health` | Public | Spring Boot Actuator health check |

---

## 3. Xác thực & Tài khoản (`auth`)

| Phương thức | Endpoint | Quyền | Mô tả |
|-------------|----------|-------|-------|
| `POST` | `/api/v1/auth/register` | Public | Đăng ký tài khoản Khách hàng (`ROLE_USER`), băm mật khẩu bằng BCrypt và trả về JWT |
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập bằng `email` và `password`, trả về `accessToken` và thông tin `user` |
| `GET` | `/api/v1/auth/me` | Authenticated | Lấy thông tin tài khoản hiện tại từ JWT token |

---

## 4. Danh mục & Món ăn Công khai (`catalog` – Public)

| Phương thức | Endpoint | Quyền | Mô tả |
|-------------|----------|-------|-------|
| `GET` | `/api/v1/catalog/categories` | Public (Guest/User) | Lấy danh sách các danh mục món ăn đang hoạt động |
| `GET` | `/api/v1/catalog/dishes?categoryId=&keyword=` | Public (Guest/User) | Lấy danh sách món ăn đang phục vụ (`ACTIVE`), hỗ trợ lọc theo `categoryId` và `keyword` |
| `GET` | `/api/v1/catalog/dishes/{id}` | Public (Guest/User) | Xem chi tiết món ăn kèm danh sách nguyên liệu định mức cho 01 phần (`recipeItems`) |

---

## 5. Quản trị Món ăn, Nguyên liệu & Công thức (`admin/catalog` – Admin Only)

| Phương thức | Endpoint | Quyền | Mô tả |
|-------------|----------|-------|-------|
| `GET` | `/api/v1/admin/catalog/categories` | `ROLE_ADMIN` | Lấy toàn bộ danh mục món ăn |
| `POST` | `/api/v1/admin/catalog/categories` | `ROLE_ADMIN` | Tạo danh mục món ăn mới |
| `GET` | `/api/v1/admin/catalog/ingredients` | `ROLE_ADMIN` | Lấy danh sách nguyên liệu kèm tồn kho, ngưỡng cảnh báo và cờ `usedInRecipe` |
| `POST` | `/api/v1/admin/catalog/ingredients` | `ROLE_ADMIN` | Thêm nguyên liệu gốc mới (`code`, `name`, `unit`, `minStockThreshold >= 0`) |
| `PUT` | `/api/v1/admin/catalog/ingredients/{id}` | `ROLE_ADMIN` | Cập nhật thông tin nguyên liệu (khóa thay đổi `unit` nếu nguyên liệu đã dùng trong công thức món ăn – trả `400 Bad Request`) |
| `GET` | `/api/v1/admin/catalog/dishes` | `ROLE_ADMIN` | Lấy toàn bộ món ăn (bao gồm cả `ACTIVE` và `HIDDEN`) kèm công thức |
| `GET` | `/api/v1/admin/catalog/dishes/{id}` | `ROLE_ADMIN` | Xem chi tiết một món ăn bất kỳ |
| `POST` | `/api/v1/admin/catalog/dishes` | `ROLE_ADMIN` | Tạo món ăn mới kèm ít nhất 01 nguyên liệu hợp lệ trong công thức (`price >= 1000` VND nguyên, `quantity > 0`, không chứa dòng `null`) |
| `PUT` | `/api/v1/admin/catalog/dishes/{id}` | `ROLE_ADMIN` | Cập nhật thông tin món ăn và công thức nguyên liệu (`price >= 1000` VND, bắt buộc có ít nhất 01 nguyên liệu hợp lệ) |
| `PATCH` | `/api/v1/admin/catalog/dishes/{id}/status` | `ROLE_ADMIN` | Ẩn hoặc hiển thị lại món ăn (`{"status": "HIDDEN"}` / `{"status": "ACTIVE"}` – chặn chuyển sang `ACTIVE` nếu món chưa có công thức hợp lệ) |
| `PUT` | `/api/v1/admin/catalog/dishes/{id}/recipe` | `ROLE_ADMIN` | Cấu hình / cập nhật danh sách định lượng nguyên liệu cho 01 phần món (`quantity > 0`, không rỗng, không chứa dòng `null`) |

---

## 6. Quản trị Nhà Cung Cấp (`admin/suppliers` – Admin Only)

| Phương thức | Endpoint | Quyền | Mô tả |
|-------------|----------|-------|-------|
| `GET` | `/api/v1/admin/suppliers?keyword=&active=` | `ROLE_ADMIN` | Danh sách nhà cung cấp (hỗ trợ tìm kiếm theo tên, sđt, mã; lọc theo trạng thái) |
| `GET` | `/api/v1/admin/suppliers/{id}` | `ROLE_ADMIN` | Xem chi tiết một nhà cung cấp |
| `GET` | `/api/v1/admin/suppliers/{id}/receipts` | `ROLE_ADMIN` | Lấy danh sách các phiếu nhập hàng từ nhà cung cấp kèm trạng thái |
| `POST` | `/api/v1/admin/suppliers` | `ROLE_ADMIN` | Thêm nhà cung cấp mới (tự sinh mã `NCC-xxxxxx`, chặn trùng sđt `409 Conflict`) |
| `PUT` | `/api/v1/admin/suppliers/{id}` | `ROLE_ADMIN` | Cập nhật thông tin nhà cung cấp (chặn đổi sang sđt trùng của NCC khác `409 Conflict`) |
| `PATCH` | `/api/v1/admin/suppliers/{id}/toggle-active` | `ROLE_ADMIN` | Bật / tắt trạng thái hợp tác của nhà cung cấp |

---

## 7. Quản trị Kho Nguyên Liệu & Sổ Biến Động (`admin/inventory` – Admin Only)

| Phương thức | Endpoint | Quyền | Mô tả |
|-------------|----------|-------|-------|
| `GET` | `/api/v1/admin/inventory/overview` | `ROLE_ADMIN` | Tổng quan kho: giá trị tồn kho ước tính theo giá vốn bình quân di động, tổng nhập trong tháng, cảnh báo tồn thấp, 5 phiếu nhập gần nhất, 10 biến động gần nhất |
| `GET` | `/api/v1/admin/inventory/ingredients?keyword=&active=&lowStockOnly=` | `ROLE_ADMIN` | Danh sách nguyên liệu tồn kho kèm bộ lọc tìm kiếm và cờ chỉ xem tồn thấp |
| `GET` | `/api/v1/admin/inventory/ingredients/{id}` | `ROLE_ADMIN` | Chi tiết nguyên liệu: danh sách món ăn đang dùng, 10 biến động kho gần nhất, kiểm tra ràng buộc toàn vẹn có được xóa vĩnh viễn không |
| `DELETE` | `/api/v1/admin/inventory/ingredients/{id}` | `ROLE_ADMIN` | Xóa vĩnh viễn nguyên liệu (chặn `400 Bad Request` nếu đã có giao dịch kho hoặc đang dùng trong công thức món ăn) |
| `GET` | `/api/v1/admin/inventory/low-stock` | `ROLE_ADMIN` | Danh sách các nguyên liệu có tồn kho dưới hoặc bằng ngưỡng tối thiểu (`currentStock <= minStockThreshold`) |
| `POST` | `/api/v1/admin/inventory/adjustments` | `ROLE_ADMIN` | Điều chỉnh tồn kho kiểm kê thủ công (`quantityChange != 0`, bắt buộc `reason`, chặn điều chỉnh làm tồn kho âm `400 Bad Request`, ghi sổ `StockMovement` loại `ADJUSTMENT`) |
| `GET` | `/api/v1/admin/inventory/movements?ingredientId=&movementType=&fromTime=&toTime=&limit=` | `ROLE_ADMIN` | Tra cứu sổ biến động kho nguyên liệu (lọc theo nguyên liệu, loại `IMPORT`/`EXPORT`/`ADJUSTMENT`, thời gian, giới hạn số dòng) |

---

## 8. Quản trị Phiếu Nhập Nguyên Liệu & Xuất PDF (`admin/stock-receipts` – Admin Only)

| Phương thức | Endpoint | Quyền | Mô tả |
|-------------|----------|-------|-------|
| `GET` | `/api/v1/admin/stock-receipts?supplierId=&status=&paymentStatus=&fromDate=&toDate=&keyword=` | `ROLE_ADMIN` | Danh sách phiếu nhập hàng kèm bộ lọc đa tiêu chí |
| `GET` | `/api/v1/admin/stock-receipts/{id}` | `ROLE_ADMIN` | Xem chi tiết phiếu nhập kèm toàn bộ các dòng nguyên liệu (`items`) |
| `POST` | `/api/v1/admin/stock-receipts` | `ROLE_ADMIN` | Tạo phiếu nhập nguyên liệu mới (tự sinh mã `PN-xxxxxx`, tự tính tổng tiền, tùy chọn lưu `DRAFT` hoặc `CONFIRMED` ngay) |
| `PUT` | `/api/v1/admin/stock-receipts/{id}` | `ROLE_ADMIN` | Chỉnh sửa phiếu nhập Nháp (chặn sửa phiếu đã xác nhận `400 Bad Request`) |
| `DELETE` | `/api/v1/admin/stock-receipts/{id}` | `ROLE_ADMIN` | Xóa phiếu nhập Nháp (chặn xóa phiếu đã xác nhận `400 Bad Request`) |
| `POST` | `/api/v1/admin/stock-receipts/{id}/confirm` | `ROLE_ADMIN` | Xác nhận nhập kho: tăng tồn kho nguyên liệu, tính lại giá vốn bình quân di động, ghi sổ `StockMovement`, chặn xác nhận lần 2 (`400 Bad Request`) |
| `POST` | `/api/v1/admin/stock-receipts/{id}/payments` | `ROLE_ADMIN` | Ghi nhận thanh toán thêm cho nhà cung cấp (chặn trả quá tổng tiền phiếu `400 Bad Request`, cập nhật trạng thái `PARTIALLY_PAID` hoặc `PAID`) |
| `GET` | `/api/v1/admin/stock-receipts/{id}/pdf` | `ROLE_ADMIN` | Xuất file PDF khổ A4 tiêu chuẩn in ấn (font Unicode Noto Sans tiếng Việt có dấu đầy đủ, trả về `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="phieu-nhap-PN-xxxxxx.pdf"`) |

### Ví dụ Payload `POST /api/v1/admin/stock-receipts`
```json
{
  "supplierId": 1,
  "receiptDate": "2026-11-10",
  "note": "Nhập hàng hải sản phục vụ tiệc cưới cuối tuần",
  "amountPaid": 2000000,
  "paymentNote": "Chuyển khoản Vietcombank 2.000.000đ",
  "confirmImmediately": true,
  "items": [
    {
      "ingredientId": 1,
      "quantity": 10.0,
      "unitPrice": 180000,
      "note": "Tôm sú tươi sống loại 1"
    },
    {
      "ingredientId": 2,
      "quantity": 5.0,
      "unitPrice": 120000,
      "note": "Mực ống tươi"
    }
  ]
}
```

---

## 9. Thực Đơn Mẫu & Xem Trước Giá (`menus` & `admin/menus`)

| Phương thức | Endpoint | Quyền | Mô tả |
|-------------|----------|-------|-------|
| `GET` | `/api/v1/menus` | Public | Danh sách thực đơn mẫu đang hoạt động (`ACTIVE`) kèm giá mỗi bàn |
| `GET` | `/api/v1/menus/{id}` | Public | Chi tiết thực đơn mẫu kèm danh sách món, đơn giá món và giá mỗi bàn |
| `GET` | `/api/v1/menus/{id}/preview?tableCount=N` | Public | Tính thử đơn giá và kiểm tra tồn kho cho thực đơn mẫu theo quy mô N bàn |
| `GET` | `/api/v1/admin/menus?keyword=&status=&page=&size=` | `ROLE_ADMIN` | Quản trị danh sách thực đơn mẫu (hỗ trợ lọc `status`: `ACTIVE`, `HIDDEN`, `ARCHIVED`) |
| `GET` | `/api/v1/admin/menus/{id}` | `ROLE_ADMIN` | Chi tiết thực đơn mẫu bất kỳ trạng thái |
| `POST` | `/api/v1/admin/menus` | `ROLE_ADMIN` | Tạo thực đơn mẫu mới (kèm danh sách món và số phần/món/bàn) |
| `PUT` | `/api/v1/admin/menus/{id}` | `ROLE_ADMIN` | Cập nhật thông tin và danh sách món của thực đơn |
| `PATCH` | `/api/v1/admin/menus/{id}/status` | `ROLE_ADMIN` | Cập nhật trạng thái áp dụng thực đơn (`ACTIVE` / `HIDDEN` / `ARCHIVED`) |

---

## 10. Đặt Tiệc & Quản Lý Đơn Hàng (`orders`, `admin/orders`, `employee/orders`)

| Phương thức | Endpoint | Quyền | Mô tả |
|-------------|----------|-------|-------|
| `POST` | `/api/v1/orders/preview` | Public | Xem trước chi phí, tổng tiền, nhu cầu nguyên liệu và cảnh báo thiếu tồn kho (không tạo đơn) |
| `POST` | `/api/v1/orders` | `ROLE_USER`, `ROLE_ADMIN` | Đặt tiệc chính thức (bắt buộc đăng nhập, hỗ trợ Header `Idempotency-Key`, snapshot giá, khóa giữ kho 15 phút; payload gồm `eventLocation`, `guestCount`, ...) |
| `GET` | `/api/v1/orders/my` hoặc `/orders/my-orders` | `ROLE_USER`, `ROLE_ADMIN` | Danh sách đơn đặt tiệc của chính tài khoản đang đăng nhập |
| `GET` | `/api/v1/orders/{id}` | `ROLE_USER`, `ROLE_EMPLOYEE`, `ROLE_ADMIN` | Chi tiết đơn đặt tiệc (User chỉ xem đơn của mình; Employee chỉ xem đơn `PENDING_PAYMENT`; Admin xem tất cả) |
| `GET` | `/api/v1/orders/code/{orderCode}` hoặc `/by-code/{orderCode}` | `ROLE_USER`, `ROLE_EMPLOYEE`, `ROLE_ADMIN` | Tra cứu đơn hàng theo mã đơn tiệc có kiểm tra phân quyền |
| `POST` | `/api/v1/orders/{id}/cancel` | `ROLE_USER`, `ROLE_ADMIN` | Hủy đơn tiệc khi còn trong hạn 15 phút (Employee bị chặn), lập tức giải phóng nguyên liệu kho |
| `GET` | `/api/v1/admin/orders?keyword=&orderStatus=&paymentStatus=&fromDate=&toDate=&page=&size=` | `ROLE_ADMIN` | Quản trị danh sách toàn bộ đơn đặt tiệc (OrderStatus: `PENDING_PAYMENT`, `PAID`, `PREPARING`, `COMPLETED`, `CANCELLED`, `EXPIRED`) |
| `GET` | `/api/v1/admin/orders/{id}` | `ROLE_ADMIN` | Chi tiết hợp đồng đơn tiệc, món snapshot, giữ kho và audit log |
| `POST` | `/api/v1/admin/orders/{id}/cancel` | `ROLE_ADMIN` | Quản trị viên hủy đơn tiệc khi ở trạng thái hợp lệ kèm lý do nghiệp vụ bắt buộc |
| `GET` | `/api/v1/employee/orders?orderStatus=&fromDate=&toDate=&page=&size=` | `ROLE_EMPLOYEE`, `ROLE_ADMIN` | Danh sách lịch đặt tiệc theo thời gian tổ chức cho bộ phận bếp (mặc định giới hạn `PENDING_PAYMENT` cho Nhân viên) |
| `GET` | `/api/v1/employee/orders/{id}` | `ROLE_EMPLOYEE`, `ROLE_ADMIN` | Phiếu chuẩn bị bếp, số phần cần nấu (`quantityPerTable * tableCount`) và nguyên liệu cần xuất |

---

## 11. Theo Dõi Giữ Chỗ Tồn Kho (`admin/inventory/reservations`)

| Phương thức | Endpoint | Quyền | Mô tả |
|-------------|----------|-------|-------|
| `GET` | `/api/v1/admin/inventory/reservations?status=&page=&size=` | `ROLE_ADMIN` | Danh sách lệnh khóa giữ tồn kho 15 phút (ReservationStatus: `ACTIVE`, `RELEASED`, `FULFILLED`, `EXPIRED`) |
| `GET` | `/api/v1/admin/inventory/availability` hoặc `/reservations/availability` | `ROLE_ADMIN` | Báo cáo đối chiếu tồn kho vật lý (`physicalStock`), tồn đang giữ (`reservedStock`) và tồn khả dụng thực tế (`availableStock`) |

