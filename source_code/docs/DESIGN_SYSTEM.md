# BanquetHub Design System & UI/UX Standards

Tài liệu quy chuẩn toàn diện về hệ thống thiết kế giao diện (Design System), thông số thị giác, cấu trúc thành phần và các nguyên tắc UI/UX cốt lõi áp dụng trên toàn bộ nền tảng BanquetHub (cả giao diện Khách hàng công khai và Bảng điều khiển Quản trị Admin).

---

## 1. Tôn Chỉ Thiết Kế & 4 Nguyên Tắc Cốt Lõi (Core Philosophy)

### Nguyên Tắc 1: Tuyệt đối không trùng lặp thông tin (Zero Redundancy)
- Không bao giờ hiển thị lặp lại cùng một giá trị (Mã đơn hàng, Mã giao dịch, Tổng tiền, Trạng thái) trong 2 hoặc nhiều khối nằm sát nhau trên cùng một tầm nhìn.
- Mỗi thông tin quan trọng chỉ hiển thị một lần ở vị trí tiêu điểm (Executive Header hoặc dòng tổng kết hoá đơn). Các khối con chỉ hiển thị thông tin bổ trợ.

### Nguyên Tắc 2: Tinh gọn, tinh tế và tối ưu không gian hiển thị (Streamlined & Proportional Space)
- Tận dụng tối đa chiều ngang của màn hình lớn (`max-w-7xl` cho trang khách, `max-w-[1720px]` cho admin).
- Không để xảy ra tình trạng "bên trái chật ních chữ phải xuống dòng cụt lủn, bên phải thì để khoảng trống thênh thang".
- Phân chia tỷ lệ lưới khoa học: `6:6` đối với 2 cột tương đương, `8:4` hoặc `7:5` đối với bố cục Danh sách chính / Bảng tính toán hỗ trợ.

### Nguyên Tắc 3: Triệt tiêu dấu hiệu "AI-Fluff" & Văn mẫu giả lập
- **Cấm hoàn toàn các timestamp giả lập**: Không bao giờ thêm các chuỗi thời gian như `• Cập nhật 18:28 14/11/2026` hay `Cập nhật hôm nay`.
- **Cấm thanh tiện ích/thông báo thừa thãi**: Không đặt các dải banner vô nghĩa trên đỉnh thanh điều hướng (ví dụ: `• TP. Hồ Chí Minh & Hà Nội...`).
- **Cấm viền màu gradient sến súa ở mép card**: Không dùng các dải kẻ màu mè như `<div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800">`. Viền card phải sạch, thanh lịch bằng `border border-stone-200/90`.
- **Văn phong chuẩn xác, trang trọng**: Dùng ngôn ngữ ẩm thực yến tiệc chuyên nghiệp của Việt Nam, không nhồi nhét thuật ngữ máy móc ("100% tiêu chuẩn quốc tế", "HACCP" lặp lại nhiều lần).

### Nguyên Tắc 4: Kiến trúc Modal & Tấm nền mờ tuyệt đối (Portal Architecture)
- **Mọi Modal bắt buộc phải bọc bằng `createPortal(..., document.body)`**.
- Tuyệt đối không render modal trực tiếp bên trong các khối có CSS `transform` hay hiệu ứng động (`animate-fade-up-1`), vì sẽ làm thuộc tính `position: fixed` bị giới hạn trong khung div đó, gây lỗi tấm nền tối bị đứt đoạn (không phủ sidebar) và modal bị lệch tâm sang phải.
- Thông số chuẩn của Modal Overlay:
  ```tsx
  createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200/90 flex flex-col max-h-[85vh] overflow-hidden my-auto">
        {/* Header, Scrollable Body, Footer */}
      </div>
    </div>,
    document.body
  )
  ```

---

## 2. Bảng Thông Số Thiết Kế Quy Chuẩn (Design Tokens)

### 2.1 Bảng Màu Thương Hiệu (Color System)

| Phân loại | Mã màu Tailwind | Ý nghĩa / Ứng dụng thực tế |
| :--- | :--- | :--- |
| **Nền trang chính (Public)** | `#fdfcfa` / `#faf8f5` | Nền trắng ngà ánh kem ấm cúng của không gian yến tiệc cao cấp |
| **Nền trang Admin** | `#fafaf9` (`bg-stone-50`) | Nền đá ấm thanh lịch, chuyên nghiệp, dịu mắt |
| **Bề mặt Card / Khối** | `#ffffff` (`bg-white`) | Mặt nền card nổi bật trên nền stone |
| **Văn bản chính (Primary)** | `#1c1917` (`text-stone-900`) | Chữ tiêu đề và nội dung trọng tâm, độ tương phản cao |
| **Văn bản phụ (Secondary)** | `#57534e` (`text-stone-600`) | Mô tả chi tiết, hướng dẫn |
| **Nhãn nhỏ / Caption** | `#78716c` (`text-stone-500`) / `text-stone-400` | Ngày tháng, đơn vị tính, ghi chú nhỏ |
| **Primary Action (CTA Chính)** | `bg-amber-700 hover:bg-amber-800 text-white` | Nút Đặt tiệc, Lưu dữ liệu, Thanh toán (Đồng bộ tuyệt đối) |
| **Secondary Action (Nút Phụ)** | `border border-stone-300 bg-white hover:bg-stone-50 text-stone-700` | Nút Quay lại, Hủy, Đóng modal, Xem chi tiết |
| **Huy hiệu Thành công (Success)** | `bg-emerald-50 text-emerald-800 border-emerald-200/80` | Trạng thái Đã thanh toán, Hoàn thành, Tồn kho an toàn |
| **Huy hiệu Chờ / Cảnh báo (Warning)** | `bg-amber-50 text-amber-900 border-amber-200/80` | Đang giữ chỗ 15p, Chờ đối soát kế toán |
| **Huy hiệu Lỗi / Nguy hiểm (Danger)** | `bg-rose-50 text-rose-800 border-rose-200/80` | Hết hạn giữ chỗ, Đã hủy đơn, Thiếu hụt tồn kho |
| **Nút Nguy hiểm (Danger Button)**| `bg-rose-700 hover:bg-rose-800 text-white` | Xác nhận hủy đơn tiệc, Xóa dữ liệu |

---

### 2.2 Quy Chuẩn Nút Bấm & Trạng Thái (Button Standards)

- **Cấm hoàn toàn nút đặt món màu trắng** khi đó là nút kêu gọi hành động chính (CTA).
- Mọi nút bấm chính phải có trạng thái rõ ràng:
  ```html
  <!-- Primary CTA Button -->
  <button class="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
    ...
  </button>

  <!-- Secondary Outline Button -->
  <button class="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50 hover:border-stone-400 transition-colors cursor-pointer">
    ...
  </button>
  ```

---

### 2.3 Typography & Kiểu Chữ (Typography Hierarchy)

- **Font chữ toàn hệ thống**: `'Plus Jakarta Sans'`, sans-serif.
- **Quy tắc số học (`tabular-nums`)**: Bắt buộc gắn class `tabular-nums` cho toàn bộ:
  - Giá tiền VNĐ (ví dụ: `220.000 đ`).
  - Số lượng bàn, số khách, số phần ăn.
  - Số tồn kho, định lượng nguyên liệu.
  - Mã đơn hàng, mã giao dịch VietQR, số điện thoại, ngày giờ.

| Cấp bậc | Lớp Tailwind chuẩn | Ứng dụng |
| :--- | :--- | :--- |
| **Page Title (H1)** | `text-2xl sm:text-3xl font-bold tracking-tight text-stone-900` | Tiêu đề chính của từng trang |
| **Section Title (H2)** | `text-lg sm:text-xl font-bold tracking-tight text-stone-900` | Tiêu đề các phân khu lớn |
| **Card Title (H3)** | `text-base font-bold text-stone-900 tracking-tight` | Tiêu đề khối card con, tiêu đề modal |
| **Body Standard** | `text-xs sm:text-sm text-stone-600 leading-relaxed` | Đoạn văn mô tả món ăn, thể lệ, quy trình |
| **Control Label** | `text-xs font-semibold text-stone-700` | Nhãn form input, bộ lọc |
| **Metadata / Micro** | `text-[11px] text-stone-400 font-medium tabular-nums` | Mã NVL, đơn vị tính, ngày giờ tạo |

---

### 2.4 Bo Góc & Đổ Bóng (Radii & Shadows)

- **Bo góc (Border Radius)**:
  - Card lớn, Modal, Container chính: `rounded-2xl` (16px).
  - Button, Form Input, Textarea, Select: `rounded-xl` (12px).
  - Filter Tag, Badge nhỏ, Khung icon: `rounded-lg` (8px).
  - Trạng thái viên thuốc (Status Pill): `rounded-full` (9999px).
- **Đổ bóng (Shadow)**:
  - Card thường: `shadow-xs` hoặc `shadow-sm` (tự nhiên, không dùng bóng đen xì).
  - Modal: `shadow-2xl` kết hợp viền `border border-stone-200/90`.

---

### 2.5 Cấu Trúc Khung Khổ & Bố Cục (Container Layout)

- **Giao diện Khách hàng & Nhân viên (Public & Employee Layout)**:
  - Chiều rộng tối đa quy chuẩn: `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`.
  - Spacing giữa các khối chính: `space-y-8` (32px).
  - **Quy chuẩn Header Navigation**:
    - Mọi liên kết trên thanh điều hướng bắt buộc phải có thuộc tính `whitespace-nowrap` để triệt tiêu hoàn toàn lỗi vỡ dòng / chữ bị bẻ đôi dòng ("Trang" / "chủ", "Thực đơn" / "mẫu", "Chấm" / "công").
    - **Phân tách điều hướng thông minh theo vai trò người dùng (Role-Adaptive Navigation)**:
      - *Khách vãng lai & Khách hàng (`ROLE_USER`)*: Hiển thị bộ điều hướng khám phá ẩm thực (Trang chủ, Thực đơn mẫu, Tự phối thực đơn, Gợi ý AI, Món tiệc).
      - *Nhân viên (`ROLE_EMPLOYEE`)*: Thanh Header tự động chuyển sang Không gian làm việc chuyên nghiệp (Lịch điều phối bếp, Bảng chấm công, Phiếu lương của tôi) kèm lối tắt tra cứu món tiệc / thực đơn, đảm bảo không gian hiển thị rộng rãi, không bị nhồi nhét 8-9 menu gây chật chội.
- **Giao diện Quản trị (Admin Layout)**:
  - Chiều rộng tối đa quy chuẩn: `w-full max-w-[1720px] mx-auto space-y-6`.
  - Sidebar: Hỗ trợ 2 chế độ: Ghim cố định (`w-64`) hoặc Rail thu gọn (`w-20`) có tính năng rê chuột mở rộng thông minh (`hover-to-expand`).
  - Viewport chính: Tự động co giãn theo sidebar, các trang con đồng bộ wrapper `w-full max-w-[1720px] mx-auto space-y-6` không gây nhảy layout.

---

## 3. Danh Mục Trang & Ma Trận Kiểm Tra Quy Chuẩn

| Trang | Route | Yêu cầu chuẩn |
| :--- | :--- | :--- |
| **Trang chủ** | `/` | Header không có notification bar thừa, font chữ đồng bộ, nút cam `bg-amber-700`. |
| **Thực đơn mẫu** | `/menus` | Thẻ card món tiệc tỷ lệ ảnh chuẩn, nút chọn món rõ ràng. |
| **Chi tiết thực đơn** | `/menus/:id` | Bố cục 8:4 (Món ăn / Dự tính), số liệu `tabular-nums`. |
| **Tự phối thực đơn** | `/menu-builder` | Danh mục món 7 cột, giỏ món & tính giá 5 cột, kiểm tra tồn kho realtime. |
| **Danh mục món** | `/dishes` | Thẻ món ảnh 4:3, đơn giá 01 phần/bàn 10 khách rõ ràng. |
| **Chi tiết món ăn** | `/dishes/:id` | Ảnh bên trái `h-[280px]`, thông tin bên phải 3 card cân xứng, bảng công thức 8:4. |
| **Đặt tiệc (Checkout)** | `/checkout` | Form 7 cột, bản đồ rộng rãi, tóm tắt đơn 5 cột, nút xác nhận cam thương hiệu. |
| **Xác nhận đặt đơn** | `/orders/confirmation/:id` | Bố cục 6:6 cân xứng, không có vạch gradient sến súa, tổng tiền không lặp lại. |
| **Biên nhận thanh toán** | `/payment/result` | Bố cục `max-w-7xl` 8:4, header điều hành sạch sẽ, không trùng lặp mã giao dịch. |
| **Đơn tiệc của tôi** | `/my-orders` | Bảng đơn tiệc rõ ràng, nút thanh toán cam, nhãn "Ngày tạo". |
| **Chi tiết đơn tiệc** | `/my-orders/:id` | Stepper tiến độ 4 bước, modal hủy tiệc portal ra body. |
| **Admin Catalog** | `/admin/catalog` | Modal thêm/sửa món và công thức portal ra body. |
| **Admin Thực đơn** | `/admin/menus` | Modal tạo thực đơn mẫu portal ra body, căn giữa tuyệt đối. |
| **Admin Đơn đặt tiệc** | `/admin/orders` | Bộ lọc trạng thái rõ ràng, huy hiệu có màu chuẩn. |
| **Admin Thanh toán** | `/admin/payments` | Form đối soát kế toán mở rộng trong bảng gọn gàng. |
| **Admin Kho & Tồn** | `/admin/inventory/overview` | 4 thẻ KPI lớn, theo dõi giá vốn bình quân di động. |
| **Admin Giữ chỗ kho** | `/admin/inventory/reservations` | 4 thẻ KPI điều hành, 2 tab Khả dụng & Lịch sử giữ kho, công thức rõ ràng. |
| **Admin Phiếu nhập** | `/admin/inventory/receipts` | Bảng quản lý phiếu nhập, xuất PDF chuẩn hóa. |
| **Admin Nhà cung cấp** | `/admin/suppliers` | Modal thêm/sửa NCC portal ra body. |
| **Admin Hồ sơ nhân viên** | `/admin/employees` | Quản lý mã nhân sự, chức danh, lương cơ bản; gán User ID; container `max-w-[1720px]`. |
| **Admin Bảng chấm công** | `/admin/attendance` | Ma trận điểm danh 1..N ngày; màu sắc 1.0 (Xanh), 0.5 (Vàng), 0 (Đỏ); khóa sau chốt; container `max-w-[1720px]`. |
| **Admin Kỳ tính lương & chốt số** | `/admin/payroll-periods` | Mở kỳ lương, Preview dự thảo, chốt số bất biến với hash integrity; container `max-w-[1720px]`. |
| **Admin Bảng lương nhân viên** | `/admin/payrolls` | Bảng lương chính thức, bóc tách công thức lương theo công thực tế, phụ cấp, khấu trừ, giải ngân; container `max-w-[1720px]`. |
| **Admin Nhật ký chi trả lương** | `/admin/salary-payments` | Đối soát lịch sử giải ngân chi trả (tiền mặt / chuyển khoản); container `max-w-[1720px]`. |
| **Employee Lịch điều phối bếp** | `/employee/orders` | Quản lý lịch tiệc bếp, lọc theo ngày tổ chức và trạng thái; container `max-w-7xl`. |
| **Employee Phiếu chuẩn bị tiệc** | `/employee/orders/:id` | Stepper cập nhật tiến độ bếp, bóc tách định lượng NVL theo bàn; container `max-w-7xl`. |
| **Employee Chấm công của tôi** | `/employee/attendance` | Lịch sử chấm công theo tháng, KPI tổng công, bảng chi tiết 1..N ngày; container `max-w-7xl`. |
| **Employee Phiếu lương của tôi** | `/employee/payrolls` | Danh sách phiếu lương điện tử, bóc tách công thức lương, trạng thái giải ngân; container `max-w-7xl`. |
