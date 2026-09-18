# Tài liệu REST API BanquetHub – Phase 1

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

### Ví dụ `POST /api/v1/auth/login`
```json
{
  "email": "admin@banquethub.vn",
  "password": "Admin@123"
}
```

---

## 4. Danh mục & Món ăn Công khai (`catalog` – Public)

| Phương thức | Endpoint | Quyền | Mô tả |
|-------------|----------|-------|-------|
| `GET` | `/api/v1/catalog/categories` | Public (Guest/User) | Lấy danh sách các danh mục món ăn đang hoạt động |
| `GET` | `/api/v1/catalog/dishes?categoryId=&keyword=` | Public (Guest/User) | Lấy danh sách món ăn đang phục vụ (`ACTIVE`), hỗ trợ lọc theo `categoryId` và `keyword` |
| `GET` | `/api/v1/catalog/dishes/{id}` | Public (Guest/User) | Xem chi tiết món ăn kèm danh sách nguyên liệu định mức cho 01 phần (`recipeItems`) |

---

## 5. Quản trị Món ăn, Nguyên liệu & Công thức (`admin/catalog` – Admin Only)

Tất cả các endpoint dưới đây yêu cầu JWT của tài khoản có quyền **`ROLE_ADMIN`** (`401 Unauthorized` nếu chưa đăng nhập, `403 Forbidden` nếu là `ROLE_USER` hoặc `ROLE_EMPLOYEE`).

| Phương thức | Endpoint | Quyền | Mô tả |
|-------------|----------|-------|-------|
| `GET` | `/api/v1/admin/catalog/categories` | `ROLE_ADMIN` | Lấy toàn bộ danh mục món ăn |
| `POST` | `/api/v1/admin/catalog/categories` | `ROLE_ADMIN` | Tạo danh mục món ăn mới |
| `GET` | `/api/v1/admin/catalog/ingredients` | `ROLE_ADMIN` | Lấy danh sách nguyên liệu kèm tồn kho và ngưỡng cảnh báo |
| `POST` | `/api/v1/admin/catalog/ingredients` | `ROLE_ADMIN` | Thêm nguyên liệu gốc mới (`code`, `name`, `unit`, `minStockThreshold >= 0`) |
| `PUT` | `/api/v1/admin/catalog/ingredients/{id}` | `ROLE_ADMIN` | Cập nhật thông tin nguyên liệu và ngưỡng tồn tối thiểu |
| `GET` | `/api/v1/admin/catalog/dishes` | `ROLE_ADMIN` | Lấy toàn bộ món ăn (bao gồm cả `ACTIVE` và `HIDDEN`) kèm công thức |
| `GET` | `/api/v1/admin/catalog/dishes/{id}` | `ROLE_ADMIN` | Xem chi tiết một món ăn bất kỳ |
| `POST` | `/api/v1/admin/catalog/dishes` | `ROLE_ADMIN` | Tạo món ăn mới kèm danh sách công thức định lượng (`price > 0`, `quantity > 0`) |
| `PUT` | `/api/v1/admin/catalog/dishes/{id}` | `ROLE_ADMIN` | Cập nhật thông tin món ăn và công thức nguyên liệu |
| `PATCH` | `/api/v1/admin/catalog/dishes/{id}/status` | `ROLE_ADMIN` | Ẩn hoặc hiển thị lại món ăn (`{"status": "HIDDEN"}` / `{"status": "ACTIVE"}`) |
| `PUT` | `/api/v1/admin/catalog/dishes/{id}/recipe` | `ROLE_ADMIN` | Cấu hình / cập nhật danh sách định lượng nguyên liệu cho 01 phần món (`quantity > 0`) |

### Ví dụ `PUT /api/v1/admin/catalog/dishes/{id}/recipe`
```json
{
  "recipeItems": [
    {
      "ingredientId": 1,
      "quantity": 0.450,
      "note": "Tôm sú tươi bóc vỏ"
    },
    {
      "ingredientId": 8,
      "quantity": 0.300,
      "note": "Ngó sen bào giòn"
    }
  ]
}
```
