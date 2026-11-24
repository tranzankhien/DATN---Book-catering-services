# TÀI LIỆU ĐẶC TẢ USE CASE & CÁC LUỒNG NGHIỆP VỤ HỆ THỐNG
## NỀN TẢNG ĐẶT TIỆC CƯỚI & QUẢN TRỊ VẬN HÀNH ẨM THỰC BANQUETHUB

| Hạng mục | Thông tin chi tiết |
| :--- | :--- |
| **Đề tài áp dụng** | BanquetHub - Nền tảng Đặt Tiệc Cưới & Quản Trị Vận Hành Ẩm Thực Tập Trung |
| **Tài liệu dùng cho** | Báo cáo Đồ án Tốt nghiệp / Tài liệu Thiết kế & Đặc tả Kiến trúc Phần mềm |
| **Tác giả biên soạn** | Trần Văn Khiên (Email: tranzankhien@gmail.com) |
| **Hình thức trình bày** | Bảng đặc tả Use Case chuẩn công nghệ phần mềm & Khối luồng nghiệp vụ văn xuôi (Không chèn mã code, không chèn cú pháp vẽ hình) |
| **Ngày hoàn thiện** | 24/11/2026 — Phiên bản chuẩn 2.0 (Official - Đã đối soát 100% khớp mã nguồn) |

---

## PHẦN I: TỔNG QUAN CÁC TÁC NHÂN TRONG HỆ THỐNG (ACTORS)

| Tác nhân (Actor) | Phân loại | Mô tả vai trò & Trách nhiệm trong hệ thống |
| :--- | :--- | :--- |
| **Khách hàng (Customer)** | Tác nhân người dùng (Bên ngoài) | Người dùng truy cập website: duyệt món, chọn thực đơn mẫu hoặc tự phối set menu, nhận tư vấn AI Gemini, chọn địa điểm tổ chức trên bản đồ Mapbox, nhập mã ưu đãi Voucher, thanh toán 100% qua Napas QR SePay và theo dõi tiến độ đơn tiệc. |
| **Nhân viên Bếp & Điều phối (Employee)** | Tác nhân nội bộ (Nhà hàng) | Đội ngũ chế biến và phục vụ: tiếp nhận đơn tiệc đã thanh toán thành công, kiểm tra phiếu chế biến và định mức nguyên liệu đã xuất kho, cập nhật tiến độ nấu tiệc (PREPARING -> COMPLETED), chấm công hàng ngày và tra cứu bảng lương. |
| **Quản trị viên (Admin)** | Tác nhân nội bộ (Ban quản lý) | Chủ nhà hàng / Ban điều hành nắm toàn quyền: quản lý thực đơn & định mức BOM, nhập kho nguyên liệu và quản lý giá vốn bình quân, cấu hình voucher, đối soát tiền SePay, duyệt bảng lương và theo dõi báo cáo P&L. |
| **Cổng thanh toán SePay PG** | Tác nhân hệ thống (Bên thứ ba) | Hệ thống trung gian thanh toán tự động, cung cấp mã QR chuyển khoản liên ngân hàng 24/7 và phát tín hiệu Webhook tức thì về BanquetHub khi có biến động số dư thành công. |
| **Trợ lý AI Google Gemini** | Tác nhân trí tuệ nhân tạo | Mô hình ngôn ngữ lớn tiếp nhận dữ liệu tồn kho và danh mục món ăn thực tế để tư vấn tối đa 3 phương án set menu tiệc tối ưu theo ngân sách, khẩu vị và giải đáp các quy định của nhà hàng. |

---

## PHẦN II: CHI TIẾT 6 LUỒNG NGHIỆP VỤ CHÍNH TOÀN HỆ THỐNG (CORE BUSINESS FLOWS)

### ★ FLOW-01: Luồng Khách hàng Đặt tiệc, Giữ kho 15 phút & Thanh toán SePay 100% (Order & Payment Flow)

- **Mục tiêu nghiệp vụ**: Tự động hóa 100% quy trình từ chọn thực đơn, kiểm tra tồn kho realtime, khóa giữ kho 15 phút đến đối soát tiền vào tài khoản ngân hàng và xuất kho tự động.
- **Tác nhân tham gia**: Khách hàng (Customer), Cổng SePay PG, Hệ thống Quản trị Tồn kho & Đơn hàng
- **Điểm kích hoạt**: Khách hàng duyệt tìm món, chọn thực đơn và cấu hình số lượng bàn tiệc.
- **Kết quả đầu ra**: Đơn tiệc chuyển trạng thái PAID, kho vật lý được trừ ngay lập tức, giá vốn COGS được chốt và gửi email xác nhận cho khách.

| Bước thực hiện | Chi tiết diễn tiến & Phản hồi của Hệ thống BanquetHub |
| :--- | :--- |
| **Bước 1: Lên thực đơn tiệc** | Khách hàng lựa chọn 1 trong 3 phương thức: (1) Chọn Thực đơn mẫu có sẵn; (2) Tự phối từng món qua Menu Builder; hoặc (3) Nhập yêu cầu để Trợ lý AI Gemini gợi ý 3 set menu. Khách cấu hình số lượng bàn tiệc (tối thiểu 1 bàn). |
| **Bước 2: Kiểm tra tồn kho khả dụng (Preview)** | Hệ thống tự động tính tổng nhu cầu nguyên liệu theo công thức BOM x số bàn. Hệ thống kiểm tra: Tồn khả dụng = Tồn vật lý - Lượng đang giữ tạm. Nếu đủ nguyên liệu, hệ thống mở nút tiếp tục đặt tiệc. |
| **Bước 3: Nhập thông tin & Định vị bản đồ Mapbox** | Khách hàng nhập họ tên, số điện thoại đón tiếp, thời gian tổ chức, gõ địa chỉ và ghim vị trí chuẩn xác trên bản đồ số Mapbox. |
| **Bước 4: Nhập mã Voucher giảm giá thủ công** | Tại bước thanh toán, khách hàng tự gõ mã voucher (không có danh sách chọn sẵn). Hệ thống kiểm tra điều kiện (đơn tối thiểu, lượt dùng còn lại, hạn dùng) và trừ chiết khấu trực tiếp vào tổng tiền. |
| **Bước 5: Kích hoạt Lệnh giữ chỗ kho 15 phút** | Khách bấm Xác nhận đặt tiệc. Backend dùng khóa PESSIMISTIC_WRITE (sắp xếp ID nguyên liệu tăng dần để chống Deadlock), sinh Idempotency-Key chống trùng lặp, tạo đơn hàng mới (PENDING_PAYMENT, UNPAID) và tạo Lệnh giữ chỗ kho (StockReservation = ACTIVE) hiệu lực đúng 15 phút. |
| **Bước 6: Quét mã QR Napas SePay thanh toán 100%** | Khách hàng bấm Thanh toán qua SePay; màn hình hiển thị mã QR thanh toán chuẩn Napas 24/7 với số tiền chính xác 100% và nội dung chuyển khoản định danh. Khách dùng Mobile Banking quét mã chuyển tiền. |
| **Bước 7: Trừ kho tức thì & Chốt giá vốn (Webhook SePay)** | Ngay khi SePay phát Webhook xác nhận tiền vào tài khoản: Backend tự động trừ tồn kho vật lý (current_stock = current_stock - used), tạo phiếu xuất kho StockMovement (EXPORT), chốt giá vốn nguyên liệu (COGS) tại thời điểm xuất vào bảng order_ingredient_consumptions, chuyển đơn sang PAID, chuyển lệnh giữ kho sang CONSUMED và gửi email biên lai. |
| **Xử lý ngoại lệ / Quy tắc nghiệp vụ** | *Trong 15 phút, khách có thể chủ động bấm 'Hủy đơn'. Nếu quá 15 phút khách không thanh toán, scheduler quét ngầm tự động hủy đơn (EXPIRED) và giải phóng 100% nguyên liệu (RELEASED). Nếu khách chuyển muộn sau 15 phút, đơn chuyển PAYMENT_REVIEW để Admin đối soát kích hoạt thủ công.* |

---

### ★ FLOW-02: Luồng Điều phối & Chuẩn bị tiệc tại Bếp (Kitchen Order Processing & Fulfillment Flow)

- **Mục tiêu nghiệp vụ**: Tổ chức chế biến món ăn đúng thực đơn, chuẩn bị nguyên liệu đã xuất kho và theo dõi tiến độ phục vụ từ lúc nấu đến khi bàn giao tiệc.
- **Tác nhân tham gia**: Nhân viên Bếp, Đội ngũ Điều phối phục vụ, Quản trị viên (Admin)
- **Điểm kích hoạt**: Đơn tiệc đã được khách thanh toán 100% thành công (trạng thái PAID).
- **Kết quả đầu ra**: Các món ăn được chế biến theo đúng định mức đã xuất kho, phục vụ hoàn tất tại sự kiện và đơn hàng chuyển sang COMPLETED.

| Bước thực hiện | Chi tiết diễn tiến & Phản hồi của Hệ thống BanquetHub |
| :--- | :--- |
| **Bước 1: Tiếp nhận đơn tiệc đã thanh toán** | Nhân viên bếp mở danh mục đơn tiệc tại cổng /employee/orders, theo dõi các đơn hàng ở trạng thái PAID sắp tới ngày giờ tổ chức. |
| **Bước 2: Xem phiếu chế biến & Định mức xuất kho** | Nhân viên bấm vào chi tiết đơn hàng để xem danh sách món ăn, số lượng bàn tiệc và khối lượng chi tiết từng nguyên liệu đã được hệ thống xuất kho tự động cho đơn tiệc này. |
| **Bước 3: Bắt đầu chuẩn bị tiệc (PREPARING)** | Khi bắt đầu chế biến, nhân viên bếp hoặc Admin cập nhật trạng thái đơn từ PAID sang PREPARING (Đang chuẩn bị). Hệ thống tự động ghi nhật ký lịch sử và gửi email thông báo tiến độ 'ORDER_PREPARING' tới khách hàng. |
| **Bước 4: Phục vụ tại sự kiện** | Đội ngũ phục vụ vận chuyển món ăn và triển khai bày tiệc tại địa chỉ sự kiện đã ghim trên bản đồ Mapbox của khách hàng. |
| **Bước 5: Xác nhận hoàn thành phục vụ (COMPLETED)** | Sau khi buổi tiệc kết thúc tốt đẹp và khách hàng nghiệm thu hoàn tất, nhân viên/Admin bấm cập nhật trạng thái sang COMPLETED (Hoàn thành). Hệ thống gửi email 'ORDER_COMPLETED' và mở khóa tính năng đánh giá cho khách. |
| **Xử lý ngoại lệ / Quy tắc nghiệp vụ** | *Đội ngũ bếp KHÔNG thực hiện thao tác trừ kho vì toàn bộ nguyên liệu đã được hệ thống tự động trừ kho vật lý và chốt giá vốn ngay tại thời điểm thanh toán thành công (ở Luồng 1).* |

---

### ★ FLOW-03: Luồng Quản trị kho & Nhập hàng từ Nhà cung cấp (Inventory & Purchasing Flow)

- **Mục tiêu nghiệp vụ**: Quản lý chuỗi cung ứng thực phẩm tươi sạch, duy trì lượng tồn kho an toàn và tự động tính toán giá vốn bình quân gia quyền di động chuẩn kế toán.
- **Tác nhân tham gia**: Quản trị viên (Admin), Thủ kho, Nhà cung cấp thực phẩm
- **Điểm kích hoạt**: Hệ thống cảnh báo tồn kho vật lý rơi xuống dưới định mức an toàn (min_stock) hoặc chuẩn bị cho các đợt tiệc lớn.
- **Kết quả đầu ra**: Số lượng nguyên liệu trong kho được cộng dồn, đơn giá vốn bình quân gia quyền được tính lại và công nợ nhà cung cấp được cập nhật.

| Bước thực hiện | Chi tiết diễn tiến & Phản hồi của Hệ thống BanquetHub |
| :--- | :--- |
| **Bước 1: Giám sát tồn kho an toàn** | Admin theo dõi bảng Tổng quan kho; các nguyên liệu có tồn kho vật lý <= min_stock được hệ thống tự động gắn nhãn cảnh báo đỏ Cần nhập thêm. |
| **Bước 2: Lập phiếu nhập kho mới** | Thủ kho bấm Tạo phiếu nhập mới, lựa chọn Nhà cung cấp thực phẩm từ danh bạ đối tác. |
| **Bước 3: Khai báo chi tiết nguyên liệu nhập** | Thủ kho thêm từng dòng nguyên liệu, nhập số lượng mua theo đơn vị chuẩn (kg, lít, cái) và đơn giá mua thực tế trên hóa đơn. Hệ thống tự động tính thành tiền từng dòng và tổng tiền phiếu nhập. |
| **Bước 4: Xác nhận tăng tồn kho thực tế** | Thủ kho kiểm tra hàng thực tế tại kho và bấm Xác nhận nhập kho. Hệ thống cộng tồn kho vật lý đúng 1 lần, ghi nhật ký StockMovement (IMPORT) và hỗ trợ xuất file PDF phiếu nhập. |
| **Bước 5: Cập nhật giá vốn bình quân gia quyền** | Hệ thống tự động áp dụng công thức Bình quân gia quyền di động: Đơn giá vốn mới = (Tổng giá trị tồn cũ + Giá trị nhập mới) / (Số lượng tồn cũ + Số lượng nhập mới) để cập nhật giá vốn cho các lần xuất kho tiếp theo. |
| **Bước 6: Quản lý thanh toán tiền nhà cung cấp** | Admin theo dõi trạng thái thanh toán (Chưa trả / Đã trả). Chỉ khi Admin bấm đánh dấu Đã trả thì số tiền mua hàng mới chính thức được ghi nhận vào Dòng tiền ra. |
| **Xử lý ngoại lệ / Quy tắc nghiệp vụ** | *Phiếu nhập đã xác nhận không được sửa xóa trực tiếp để bảo toàn tính toàn vẹn của sổ sách; nếu có sai lệch, Admin tạo phiếu điều chỉnh kiểm kê có ghi chú lý do.* |

---

### ★ FLOW-04: Luồng Quản trị Nhân sự, Chấm công & Tính lương tự động (HR, Attendance & Payroll Flow)

- **Mục tiêu nghiệp vụ**: Minh bạch hóa việc chấm công, loại bỏ sai sót tính toán thủ công bằng công thức tính lương tự động dựa trên ngày công thực tế và ngày công chuẩn.
- **Tác nhân tham gia**: Nhân viên nhà hàng (Employee), Quản trị viên / Phòng Nhân sự (Admin), Kế toán trưởng
- **Điểm kích hoạt**: Nhân viên thực hiện công việc hàng ngày và chu kỳ quyết toán lương vào cuối mỗi tháng.
- **Kết quả đầu ra**: Bảng lương tháng được phê duyệt, phiếu lương cá nhân phát hành cho nhân viên và chi phí tiền lương được ghi nhận vào báo cáo tài chính.

| Bước thực hiện | Chi tiết diễn tiến & Phản hồi của Hệ thống BanquetHub |
| :--- | :--- |
| **Bước 1: Chấm công hàng ngày** | Nhân viên mở trang Chấm công cá nhân (/employee/my-attendance) để bấm Chấm công vào ca / Chấm công tan ca, hoặc Admin chấm công hàng ngày cho nhân viên với các mức 0 công, 0.5 công, hoặc 1 công. |
| **Bước 2: Khởi tạo Kỳ lương tháng mới** | Đến cuối tháng, Admin vào mục Kỳ lương, tạo kỳ lương cho tháng tương ứng với Ngày công chuẩn mặc định là 26 ngày (có thể tùy chỉnh). |
| **Bước 3: Nhập các khoản Phụ cấp & Khấu trừ** | Admin khai báo các khoản phụ cấp trách nhiệm, tiền thưởng phục vụ sự kiện tiệc hoặc các khoản khấu trừ vi phạm/tạm ứng cho từng nhân viên. |
| **Bước 4: Tự động tính toán bảng lương** | Admin bấm Tính toán bảng lương. Hệ thống tự động áp dụng công thức chuẩn: Thực lĩnh = (Lương tháng cố định x Tổng công thực tế / Công chuẩn) + Phụ cấp - Khấu trừ. |
| **Bước 5: Phê duyệt & Đánh dấu chi trả lương** | Ban giám đốc kiểm tra bảng tổng hợp lương, bấm Phê duyệt kỳ lương để phát hành phiếu lương cho nhân viên tra cứu trên cổng Self-Service, sau đó đánh dấu Đã thanh toán để ghi nhận chi phí lương vào dòng tiền. |
| **Xử lý ngoại lệ / Quy tắc nghiệp vụ** | *Nếu có sai sót ngày công, Admin có thể điều chỉnh lại bảng chấm công của nhân viên trước khi bấm chốt phê duyệt bảng lương.* |

---

### ★ FLOW-05: Luồng Quản trị Chiến dịch Ưu đãi & Áp dụng Voucher (Voucher Campaign & Discount Flow)

- **Mục tiêu nghiệp vụ**: Quản lý chặt chẽ các chương trình khuyến mãi, bảo đảm an toàn tài chính qua các hạn mức giảm tối đa và giá trị đơn hàng tối thiểu.
- **Tác nhân tham gia**: Quản trị viên (Admin), Khách hàng đặt tiệc (Customer)
- **Điểm kích hoạt**: Nhà hàng triển khai chiến dịch kích cầu đặt tiệc theo mùa hoặc tri ân khách hàng thân thiết.
- **Kết quả đầu ra**: Khách hàng được hưởng chiết khấu hợp lệ, số tiền thanh toán giảm xuống và số lượt sử dụng voucher được hệ thống cập nhật chính xác.

| Bước thực hiện | Chi tiết diễn tiến & Phản hồi của Hệ thống BanquetHub |
| :--- | :--- |
| **Bước 1: Cấu hình mã voucher mới** | Admin vào trang Quản lý Voucher, bấm Thêm voucher mới và nhập: Mã voucher (ví dụ: TIECXUAN2026), hình thức giảm (% hoặc tiền cố định), giá trị giảm, mức giảm tối đa, giá trị đơn tiệc tối thiểu (minOrderAmount), tổng lượt dùng toàn hệ thống, số lượt tối đa/khách và hạn dùng. |
| **Bước 2: Kích hoạt voucher** | Admin lưu voucher; hệ thống đưa voucher vào trạng thái Hoạt động. Mã voucher sẵn sàng được áp dụng. |
| **Bước 3: Khách hàng nhập mã thủ công** | Tại màn hình đặt tiệc, khách hàng tự gõ mã voucher vào ô khuyến mãi (hệ thống không cung cấp danh sách chọn sẵn để bảo mật mã ưu đãi). |
| **Bước 4: Thẩm định điều kiện tự động** | Hệ thống kiểm tra realtime: mã có tồn tại, còn trong hạn, tổng tiền đơn tiệc có đạt mức tối thiểu và khách chưa dùng quá số lượt quy định. |
| **Bước 5: Áp dụng chiết khấu & Tăng lượt dùng** | Hệ thống hiển thị dòng giảm giá màu xanh nổi bật và trừ tiền trực tiếp vào tổng tiền cần thanh toán. Khi đơn tiệc được thanh toán 100% thành công qua SePay, hệ thống tự động tăng số lượt đã dùng của voucher lên 1 đơn vị. |
| **Xử lý ngoại lệ / Quy tắc nghiệp vụ** | *Nếu khách hàng thay đổi số lượng bàn tiệc làm tổng tiền rơi xuống dưới mức tối thiểu của voucher, hệ thống lập tức hủy áp dụng mã và thông báo rõ ràng.* |

---

### ★ FLOW-06: Luồng Đối soát Dòng tiền & Báo cáo Lợi nhuận P&L (Cashflow Reconciliation & P&L Reporting Flow)

- **Mục tiêu nghiệp vụ**: Cung cấp số liệu tài chính thời gian thực giúp ban giám đốc nắm rõ doanh thu tiệc thuần, giá vốn hàng bán (COGS), chi phí nhân sự và tỷ suất lợi nhuận ròng.
- **Tác nhân tham gia**: Quản trị viên (Admin), Kế toán trưởng, Giám đốc điều hành
- **Điểm kích hoạt**: Giao dịch thanh toán phát sinh hoặc định kỳ tổng kết kinh doanh hàng tháng/quý.
- **Kết quả đầu ra**: Báo cáo Dòng tiền (Cashflow) và Báo cáo Lợi nhuận thuần (P&L) được kết xuất tự động, minh bạch và chính xác theo chuẩn kế toán.

| Bước thực hiện | Chi tiết diễn tiến & Phản hồi của Hệ thống BanquetHub |
| :--- | :--- |
| **Bước 1: Thu thập giao dịch ngân hàng tự động** | Cổng SePay bắn Webhook ghi nhận mọi giao dịch chuyển khoản Napas 24/7 vào cơ sở dữ liệu của BanquetHub. |
| **Bước 2: Đối soát thanh toán tự động & Xử lý ngoại lệ** | Hệ thống tự động so khớp mã đơn hàng và số tiền để chuyển giao dịch sang Đã khớp. Nếu khách chuyển muộn sau 15 phút, giao dịch được đưa vào PAYMENT_REVIEW để kế toán kiểm tra và kích hoạt đơn thủ công. |
| **Bước 3: Bóc tách Doanh thu thuần** | Hệ thống tổng hợp Doanh thu thực nhận từ các đơn tiệc đã hoàn thành (sau khi trừ chiết khấu voucher). |
| **Bước 4: Bóc tách Giá vốn (COGS) & Chi phí vận hành** | Hệ thống tổng hợp Giá vốn nguyên liệu thực xuất (COGS) dựa trên bảng order_ingredient_consumptions theo đơn giá bình quân gia quyền tại thời điểm xuất kho, cộng với Chi phí lương nhân viên đã duyệt trong kỳ và các chi phí vận hành khác. |
| **Bước 5: Kết xuất Báo cáo P&L và Báo cáo Dòng tiền** | Hệ thống tự động tính ra Lợi nhuận gộp và Lợi nhuận ròng (Net Profit) trong Báo cáo P&L. Đồng thời hiển thị Báo cáo Dòng tiền (Cashflow = Tiền thực thu từ SePay - Tiền thực trả NCC - Tiền lương thực trả - Chi phí khác). |
| **Xử lý ngoại lệ / Quy tắc nghiệp vụ** | *Hệ thống phân định rạch ròi: Tiền mua nguyên liệu nhập kho chưa dùng KHÔNG được tính vào giá vốn của Báo cáo P&L để tránh tính trùng chi phí hai lần.* |

---

## PHẦN III: MA TRẬN TỔNG HỢP 22 USE CASE HỆ THỐNG BANQUETHUB

| Mã UC | Tên Use Case | Tác nhân chính | Phân hệ phụ trách |
| :---: | :--- | :--- | :--- |
| **UC-01** | Đăng ký tài khoản và xác thực mã otp qua email | Khách hàng mới | Phân hệ Khách hàng |
| **UC-02** | Đăng nhập hệ thống và phân quyền phiên làm việc (rbac) | Khách hàng, Nhân viên bếp, Quản trị viên | Phân hệ Khách hàng & Phân quyền |
| **UC-03** | Khám phá món tiệc và xem chi tiết định mức dinh dưỡng | Khách hàng | Phân hệ Khách hàng |
| **UC-04** | Chọn thực đơn mẫu hoặc tự phối thực đơn (menu builder) | Khách hàng | Phân hệ Khách hàng |
| **UC-05** | Tư vấn thực đơn bằng trợ lý ai gemini & chatbot hỗ trợ | Khách hàng | Phân hệ Khách hàng |
| **UC-06** | Định vị địa chỉ tổ chức tiệc trên bản đồ số mapbox | Khách hàng | Phân hệ Khách hàng |
| **UC-07** | Áp dụng mã ưu đãi / voucher giảm giá vào đơn tiệc | Khách hàng | Phân hệ Khách hàng |
| **UC-08** | Xác nhận đặt tiệc và kích hoạt lệnh giữ chỗ kho 15 phút | Khách hàng | Phân hệ Khách hàng |
| **UC-09** | Thanh toán trực tuyến 100% qua napas qr sepay & trừ kho tự động | Khách hàng | Phân hệ Khách hàng & Thanh toán |
| **UC-10** | Hủy đơn chủ động hoặc tự động hoàn trả kho khi hết hạn 15 phút | Khách hàng | Phân hệ Khách hàng & Tác vụ tự động |
| **UC-11** | Theo dõi tiến độ chuẩn bị tiệc và in hợp đồng biên lai điện tử | Khách hàng | Phân hệ Khách hàng |
| **UC-12** | Tiếp nhận đơn tiệc đã thanh toán và kiểm tra định mức nấu | Nhân viên Bếp, Điều phối viên | Phân hệ Nhân viên & Bếp |
| **UC-13** | Cập nhật tiến độ chế biến và hoàn thành bàn giao tiệc | Nhân viên Bếp, Quản trị viên | Phân hệ Nhân viên & Bếp |
| **UC-14** | Nhân viên thực hiện chấm công ca làm việc hàng ngày | Nhân viên nhà hàng | Phân hệ Nhân viên |
| **UC-15** | Nhân viên tra cứu phiếu lương cá nhân hàng tháng | Nhân viên nhà hàng | Phân hệ Nhân viên |
| **UC-16** | Quản lý danh mục món ăn và định mức nguyên liệu (bom) | Quản trị viên | Phân hệ Quản trị |
| **UC-17** | Lập phiếu nhập kho nguyên liệu và tính giá vốn bình quân gia quyền | Quản trị viên, Thủ kho | Phân hệ Quản trị |
| **UC-18** | Giám sát tồn kho khả dụng và cảnh báo nguyên liệu sắp hết | Quản trị viên | Phân hệ Quản trị |
| **UC-19** | Quản lý chiến dịch ưu đãi và cấu hình hạn mức voucher | Quản trị viên | Phân hệ Quản trị |
| **UC-20** | Giám sát và đối soát dòng tiền giao dịch ngân hàng sepay | Quản trị viên, Kế toán trưởng | Phân hệ Quản trị & Tài chính |
| **UC-21** | Quản trị hồ sơ nhân sự, duyệt công và tự động tính bảng lương | Quản trị viên, Trưởng phòng Nhân sự | Phân hệ Quản trị & Nhân sự |
| **UC-22** | Báo cáo tài chính doanh thu, chi phí giá vốn và lợi nhuận (p&l) | Quản trị viên, Giám đốc điều hành | Phân hệ Quản trị & Báo cáo |

---

## PHẦN IV: BẢNG ĐẶC TẢ CHI TIẾT 22 USE CASE (CHUẨN CÔNG NGHỆ PHẦN MỀM)

### ■ PHÂN HỆ KHÁCH HÀNG (CUSTOMER PORTAL)

#### UC-01: ĐĂNG KÝ TÀI KHOẢN VÀ XÁC THỰC MÃ OTP QUA EMAIL

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-01: ĐĂNG KÝ TÀI KHOẢN VÀ XÁC THỰC MÃ OTP QUA EMAIL** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng mới (Guest / Customer) |
| **Mô tả tóm tắt (Description)** | Cho phép người dùng mới tạo tài khoản cá nhân trên hệ thống BanquetHub và xác thực quyền sở hữu email chính chủ bằng mã OTP bảo mật 6 chữ số. |
| **Tiền điều kiện (Preconditions)** | Người dùng chưa có tài khoản trên hệ thống và sở hữu một hộp thư điện tử cá nhân hợp lệ. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng truy cập trang web BanquetHub và bấm nút Đăng ký trên thanh điều hướng.<br>• <b>Bước 2</b>: Khách hàng nhập đầy đủ thông tin: Họ và tên, Số điện thoại, Địa chỉ Email và Mật khẩu đăng nhập.<br>• <b>Bước 3</b>: Khách hàng bấm Đăng ký. Hệ thống kiểm tra tính hợp lệ của dữ liệu, mã hóa mật khẩu và gửi email chứa mã OTP 6 chữ số có hiệu lực trong 5 phút.<br>• <b>Bước 4</b>: Giao diện hiển thị cửa sổ nhập mã OTP kèm đồng hồ đếm ngược thời gian hiệu lực 5 phút.<br>• <b>Bước 5</b>: Khách hàng mở hòm thư email, lấy mã xác thực OTP và nhập vào ô xác nhận rồi bấm Xác minh.<br>• <b>Bước 6</b>: Hệ thống kiểm tra mã OTP: nếu trùng khớp và còn hạn, tài khoản được kích hoạt thành công và tự động chuyển hướng sang trang Đăng nhập. |
| **Hậu điều kiện (Postconditions)** | Tài khoản người dùng được lưu trữ an toàn trong cơ sở dữ liệu với trạng thái Đã kích hoạt (ENABLED). |
| **Quy tắc nghiệp vụ & Lưu ý** | *Nếu nhập sai mã quá 5 lần hoặc quá 5 phút, mã OTP cũ bị vô hiệu hóa và người dùng phải bấm Gửi lại mã OTP mới.* |

---

#### UC-02: ĐĂNG NHẬP HỆ THỐNG VÀ PHÂN QUYỀN PHIÊN LÀM VIỆC (RBAC)

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-02: ĐĂNG NHẬP HỆ THỐNG VÀ PHÂN QUYỀN PHIÊN LÀM VIỆC (RBAC)** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng & Phân quyền |
| **Tác nhân chính (Primary Actor)** | Khách hàng, Nhân viên bếp, Quản trị viên |
| **Mô tả tóm tắt (Description)** | Xác thực danh tính người dùng qua Email/Mật khẩu, cấp phát mã phiên làm việc an toàn (JWT/Session) và phân quyền truy cập theo 3 vai trò: ROLE_USER, ROLE_EMPLOYEE, ROLE_ADMIN. |
| **Tiền điều kiện (Preconditions)** | Tài khoản người dùng đã được đăng ký và kích hoạt hợp lệ trong hệ thống. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Người dùng truy cập vào trang Đăng nhập.<br>• <b>Bước 2</b>: Người dùng nhập Email và Mật khẩu cá nhân, sau đó bấm nút Đăng nhập.<br>• <b>Bước 3</b>: Hệ thống kiểm tra mật khẩu mã hóa và kiểm tra trạng thái tài khoản đang hoạt động.<br>• <b>Bước 4</b>: Hệ thống khởi tạo mã phiên làm việc an toàn và lưu trữ trên trình duyệt của người dùng.<br>• <b>Bước 5</b>: Hệ thống tự động điều hướng: Khách hàng (ROLE_USER) về Trang chủ/Đặt tiệc; Nhân viên (ROLE_EMPLOYEE) về Cổng chuẩn bị đơn bếp; Quản trị viên (ROLE_ADMIN) về Trang Quản trị trung tâm. |
| **Hậu điều kiện (Postconditions)** | Người dùng đăng nhập thành công, phiên làm việc được duy trì và giao diện hiển thị đúng quyền hạn được cấp. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Hệ thống tự động khóa tạm thời 15 phút nếu người dùng nhập sai mật khẩu liên tiếp quá 5 lần nhằm ngăn chặn tấn công dò mật khẩu.* |

---

#### UC-03: KHÁM PHÁ MÓN TIỆC VÀ XEM CHI TIẾT ĐỊNH MỨC DINH DƯỠNG

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-03: KHÁM PHÁ MÓN TIỆC VÀ XEM CHI TIẾT ĐỊNH MỨC DINH DƯỠNG** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer) |
| **Mô tả tóm tắt (Description)** | Cho phép khách hàng duyệt xem danh mục món ăn công khai của nhà hàng kèm hình ảnh chất lượng cao, giá bán niêm yết theo 1 phần/đĩa cho 1 bàn và chi tiết nguyên liệu cấu thành. |
| **Tiền điều kiện (Preconditions)** | Khách hàng truy cập trang web BanquetHub. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng bấm vào mục Món tiệc trên menu chính của website.<br>• <b>Bước 2</b>: Hệ thống hiển thị danh mục món ăn phân theo từng nhóm: Khai vị, Món chính, Lẩu & Canh, Tráng miệng, Đồ uống.<br>• <b>Bước 3</b>: Khách hàng sử dụng ô tìm kiếm theo tên món hoặc chọn bộ lọc phân loại để xem các món ăn phù hợp.<br>• <b>Bước 4</b>: Khách hàng bấm vào món ăn bất kỳ để xem trang chi tiết: hình ảnh sắc nét, đơn giá niêm yết cho 1 phần ăn, mô tả hương vị và các nguyên liệu chính cấu thành món ăn. |
| **Hậu điều kiện (Postconditions)** | Khách hàng nắm rõ thông tin món ăn và có thể đưa món vào bàn tiệc tự phối. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Chỉ những món ăn đang ở trạng thái Hoạt động và có đầy đủ công thức định mức nguyên liệu (BOM) mới được hiển thị công khai trên website.* |

---

#### UC-04: CHỌN THỰC ĐƠN MẪU HOẶC TỰ PHỐI THỰC ĐƠN (MENU BUILDER)

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-04: CHỌN THỰC ĐƠN MẪU HOẶC TỰ PHỐI THỰC ĐƠN (MENU BUILDER)** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer) |
| **Mô tả tóm tắt (Description)** | Cung cấp 2 lựa chọn lên thực đơn linh hoạt: Khách có thể chọn Set thực đơn mẫu do nhà hàng thiết kế sẵn hoặc Tự phối từng món ăn cho bàn tiệc và kiểm tra tồn kho realtime. |
| **Tiền điều kiện (Preconditions)** | Khách hàng truy cập trang Thực đơn mẫu hoặc trang Tự phối thực đơn (Menu Builder). |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng lựa chọn phương thức: Chọn một Set thực đơn mẫu có sẵn HOẶC tự chọn từng món ăn từ danh mục vào cấu hình bàn tiệc.<br>• <b>Bước 2</b>: Khách hàng cấu hình số lượng bàn tiệc dự kiến (mặc định 6 bàn, có thể tăng giảm tùy ý từ 1 bàn trở lên) và số phần ăn của từng món trên mỗi bàn.<br>• <b>Bước 3</b>: Hệ thống gọi API /api/v1/orders/preview tính toán thời gian thực: Tổng giá trị 1 bàn, Tổng tiền toàn tiệc và bóc tách định mức nguyên liệu đối chiếu tồn kho khả dụng.<br>• <b>Bước 4</b>: Hệ thống hiển thị bảng kiểm tra nguyên liệu: nếu toàn bộ nguyên liệu đủ đáp ứng, hiển thị thông báo sẵn sàng phục vụ; nếu thiếu, cảnh báo rõ tên nguyên liệu thiếu và khóa nút tiếp tục.<br>• <b>Bước 5</b>: Khách hàng bấm nút Tiếp tục đặt tiệc để chuyển toàn bộ cấu hình thực đơn sang bước xác nhận thông tin sự kiện. |
| **Hậu điều kiện (Postconditions)** | Thực đơn tiệc được cấu hình hoàn chỉnh và xác nhận đủ nguyên liệu trong kho để phục vụ. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Tồn kho khả dụng = Tồn vật lý trong kho - Lượng nguyên liệu đang bị các đơn khác khóa giữ chỗ trong 15 phút.* |

---

#### UC-05: TƯ VẤN THỰC ĐƠN BẰNG TRỢ LÝ AI GEMINI & CHATBOT HỖ TRỢ

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-05: TƯ VẤN THỰC ĐƠN BẰNG TRỢ LÝ AI GEMINI & CHATBOT HỖ TRỢ** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer) |
| **Mô tả tóm tắt (Description)** | Hỗ trợ khách hàng nhận tư vấn tối đa 3 phương án thực đơn tiệc trọn gói từ Trí tuệ nhân tạo Google Gemini theo mô tả bối cảnh & ngân sách, hoặc giải đáp chính sách dịch vụ qua Chatbot. |
| **Tiền điều kiện (Preconditions)** | Khách hàng mở trang Gợi ý AI hoặc bấm vào biểu tượng Chatbot ở góc phải màn hình. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng nhập yêu cầu bằng câu từ tự nhiên (ví dụ: 'Gợi ý giúp tôi thực đơn cưới 10 bàn, ngân sách 2.5 triệu/bàn, món thanh đạm').<br>• <b>Bước 2</b>: Khách hàng bấm nút Nhờ AI tư vấn.<br>• <b>Bước 3</b>: Backend gửi yêu cầu kèm danh mục món ăn và dữ liệu tồn kho thực tế tới mô hình Google Gemini AI để tính toán.<br>• <b>Bước 4</b>: Trợ lý AI phản hồi tối đa 3 phương án thực đơn hoàn chỉnh: tên set tiệc, danh sách món hài hòa dinh dưỡng, tổng chi phí dự tính và lời khuyên ẩm thực chuyên nghiệp.<br>• <b>Bước 5</b>: Khách hàng bấm nút Áp dụng thực đơn này trên phương án ưng ý để nạp toàn bộ danh sách món vào giỏ đặt tiệc. |
| **Hậu điều kiện (Postconditions)** | Khách hàng nhanh chóng có được thực đơn tiệc tối ưu mà không mất nhiều thời gian tự chọn từng món. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Khi khách hỏi về chính sách hủy tiệc hoặc hoàn tiền, Chatbot tuân thủ đúng quy định: thông báo nhà hàng không hoàn tiền tự động trên web, việc hủy/dời tiệc căn cứ theo điều khoản hợp đồng giữa hai bên.* |

---

#### UC-06: ĐỊNH VỊ ĐỊA CHỈ TỔ CHỨC TIỆC TRÊN BẢN ĐỒ SỐ MAPBOX

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-06: ĐỊNH VỊ ĐỊA CHỈ TỔ CHỨC TIỆC TRÊN BẢN ĐỒ SỐ MAPBOX** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer) |
| **Mô tả tóm tắt (Description)** | Giúp khách hàng tìm kiếm địa điểm và ghim vị trí tổ chức tiệc chuẩn xác trên bản đồ số tương tác Mapbox để phục vụ công tác điều phối sau này. |
| **Tiền điều kiện (Preconditions)** | Khách hàng đang ở màn hình Xác nhận đặt tiệc. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng di chuyển đến mục Thông tin địa điểm tổ chức tiệc.<br>• <b>Bước 2</b>: Khách hàng nhập địa chỉ (số nhà, tên đường, tên tòa nhà hoặc trung tâm hội nghị) vào ô tìm kiếm.<br>• <b>Bước 3</b>: Hệ thống hiển thị danh sách các địa chỉ gợi ý chuẩn xác tại Việt Nam qua kết nối Mapbox Geocoding API.<br>• <b>Bước 4</b>: Khách hàng bấm chọn địa chỉ chính xác nhất trong danh sách gợi ý.<br>• <b>Bước 5</b>: Bản đồ tự động hiển thị ghim vị trí tương ứng và hệ thống lưu lại tọa độ kinh độ/vĩ độ vào đơn hàng. |
| **Hậu điều kiện (Postconditions)** | Địa chỉ tổ chức tiệc kèm tọa độ định vị được liên kết chặt chẽ với đơn tiệc. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Khách hàng có thể kéo thả nhẹ ghim trên bản đồ để tinh chỉnh vị trí đón tiếp khách chính xác nhất.* |

---

#### UC-07: ÁP DỤNG MÃ ƯU ĐÃI / VOUCHER GIẢM GIÁ VÀO ĐƠN TIỆC

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-07: ÁP DỤNG MÃ ƯU ĐÃI / VOUCHER GIẢM GIÁ VÀO ĐƠN TIỆC** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer) |
| **Mô tả tóm tắt (Description)** | Cho phép khách hàng tự nhập mã voucher khuyến mại để được giảm trừ tiền trực tiếp vào tổng hóa đơn thanh toán của đơn tiệc. |
| **Tiền điều kiện (Preconditions)** | Khách hàng đang ở bước thanh toán và có mã ưu đãi hợp lệ do nhà hàng phát hành. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Tại màn hình đặt tiệc, khách hàng tìm đến mục Mã ưu đãi / Voucher.<br>• <b>Bước 2</b>: Khách hàng tự tay gõ mã khuyến mại (ví dụ: TIECXUAN2026) vào ô nhập mã.<br>• <b>Bước 3</b>: Khách hàng bấm nút Áp dụng.<br>• <b>Bước 4</b>: Hệ thống kiểm tra điều kiện mã: thời hạn hiệu lực, giá trị đơn tiệc hiện tại có đạt mức tối thiểu (minOrderAmount), và tài khoản khách chưa dùng quá số lượt cho phép.<br>• <b>Bước 5</b>: Nếu hợp lệ, hệ thống tính toán số tiền được giảm (giảm tiền mặt hoặc giảm theo %) và hiển thị dòng giảm giá màu xanh nổi bật.<br>• <b>Bước 6</b>: Tổng số tiền cần thanh toán của đơn tiệc được tự động giảm trừ ngay lập tức. |
| **Hậu điều kiện (Postconditions)** | Đơn tiệc được ghi nhận mức giảm giá voucher và giảm bớt số tiền cần thanh toán. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Hệ thống bắt buộc khách phải tự nhập mã thủ công, không có danh sách chọn sẵn để đảm bảo tính độc quyền của các chiến dịch ưu đãi.* |

---

#### UC-08: XÁC NHẬN ĐẶT TIỆC VÀ KÍCH HOẠT LỆNH GIỮ CHỖ KHO 15 PHÚT

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-08: XÁC NHẬN ĐẶT TIỆC VÀ KÍCH HOẠT LỆNH GIỮ CHỖ KHO 15 PHÚT** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer) |
| **Mô tả tóm tắt (Description)** | Chốt thông tin đặt tiệc và kích hoạt cơ chế khóa giữ nguyên liệu kho trong 15 phút, bảo đảm không bị người khác tranh mua mất trong lúc khách chuẩn bị thanh toán. |
| **Tiền điều kiện (Preconditions)** | Khách hàng đã hoàn tất việc chọn thực đơn, ngày giờ, địa điểm và kiểm tra tổng tiền. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng rà soát lại thông tin sự kiện: người đại diện, số điện thoại, ngày giờ tổ chức, địa điểm bản đồ, số bàn và tổng thanh toán.<br>• <b>Bước 2</b>: Khách hàng bấm nút Xác nhận đặt tiệc.<br>• <b>Bước 3</b>: Backend sử dụng khóa bi quan PESSIMISTIC_WRITE kiểm tra kho lần cuối, sinh Idempotency-Key chống trùng lặp, tạo đơn tiệc mới với trạng thái PENDING_PAYMENT.<br>• <b>Bước 4</b>: Hệ thống tạo Lệnh giữ chỗ nguyên liệu kho (StockReservation = ACTIVE) với thời hạn đúng 15 phút, khóa lượng nguyên liệu định mức lại.<br>• <b>Bước 5</b>: Màn hình chuyển sang trang Xác nhận đơn hàng thành công, hiển thị đồng hồ đếm ngược 15:00 và nút dẫn sang cổng thanh toán SePay. |
| **Hậu điều kiện (Postconditions)** | Đơn tiệc được tạo, kho nguyên liệu được giữ chỗ an toàn và đồng hồ đếm ngược bắt đầu chạy. |
| **Quy tắc nghiệp vụ & Lưu ý** | *BanquetHub áp dụng cơ chế thanh toán 100% để đảm bảo nguyên liệu tươi sống cho bữa tiệc, hoàn toàn không áp dụng hình thức đặt cọc 50%.* |

---

#### UC-09: THANH TOÁN TRỰC TUYẾN 100% QUA NAPAS QR SEPAY & TRỪ KHO TỰ ĐỘNG

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-09: THANH TOÁN TRỰC TUYẾN 100% QUA NAPAS QR SEPAY & TRỪ KHO TỰ ĐỘNG** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng & Thanh toán |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer), Cổng SePay PG |
| **Mô tả tóm tắt (Description)** | Khách hàng quét mã QR Napas 24/7 SePay để thanh toán 100% đơn tiệc; hệ thống tự nhận tiền, tự động trừ kho vật lý ngay lập tức, chốt giá vốn và kích hoạt đơn thành công. |
| **Tiền điều kiện (Preconditions)** | Đơn tiệc đang ở trạng thái PENDING_PAYMENT và còn trong thời hạn giữ chỗ 15 phút. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng bấm nút Thanh toán ngay qua SePay trên giao diện đơn hàng.<br>• <b>Bước 2</b>: Màn hình hiển thị mã QR Napas 24/7 có sẵn số tiền thanh toán 100% và nội dung chuyển khoản định danh riêng cho đơn hàng.<br>• <b>Bước 3</b>: Khách hàng mở ứng dụng ngân hàng (Mobile Banking) trên điện thoại, quét mã QR và xác nhận chuyển khoản.<br>• <b>Bước 4</b>: Ngay khi ngân hàng báo có, cổng SePay tự động bắn Webhook IPN kèm mã bảo mật X-Secret-Key về BanquetHub.<br>• <b>Bước 5</b>: Backend xác thực chữ ký và số tiền khớp 100%: Lập tức trừ tồn kho vật lý (current_stock = current_stock - used), tạo phiếu xuất kho StockMovement (EXPORT), chốt giá vốn nguyên liệu (COGS) tại thời điểm xuất vào bảng order_ingredient_consumptions, chuyển lệnh giữ kho sang CONSUMED, và chuyển đơn sang PAID.<br>• <b>Bước 6</b>: Màn hình của khách hàng tự động cập nhật thông báo Đã thanh toán thành công và hệ thống gửi email biên lai xác nhận. |
| **Hậu điều kiện (Postconditions)** | Đơn tiệc chính thức thanh toán thành công, kho vật lý đã được xuất trừ và đơn sẵn sàng cho khâu chuẩn bị bếp. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Giao dịch xử lý tự động hoàn toàn 24/7 không cần nhân viên kế toán can thiệp hay duyệt bill thủ công.* |

---

#### UC-10: HỦY ĐƠN CHỦ ĐỘNG HOẶC TỰ ĐỘNG HOÀN TRẢ KHO KHI HẾT HẠN 15 PHÚT

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-10: HỦY ĐƠN CHỦ ĐỘNG HOẶC TỰ ĐỘNG HOÀN TRẢ KHO KHI HẾT HẠN 15 PHÚT** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng & Tác vụ tự động |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer), Scheduler ngầm |
| **Mô tả tóm tắt (Description)** | Giải phóng nguyên liệu bị khóa nếu khách hàng chủ động hủy đơn hoặc không thanh toán trong vòng 15 phút, bảo đảm kho không bị giam giữ ảo. |
| **Tiền điều kiện (Preconditions)** | Đơn tiệc đang ở trạng thái PENDING_PAYMENT. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Trường hợp 1 (Khách chủ động hủy): Trong vòng 15 phút, khách bấm Hủy đơn hàng trên giao diện đơn tiệc. Hệ thống chuyển đơn sang CANCELLED và giải phóng giữ chỗ ngay.<br>• <b>Bước 2</b>: Trường hợp 2 (Hết hạn 15 phút): Tác vụ tự động ReservationExpiryScheduler chạy quét ngầm mỗi phút trên máy chủ hệ thống.<br>• <b>Bước 3</b>: Hệ thống phát hiện các đơn hàng PENDING_PAYMENT đã quá hạn 15 phút và tự động cập nhật trạng thái đơn thành EXPIRED.<br>• <b>Bước 4</b>: Lệnh giữ chỗ kho tương ứng được chuyển sang RELEASED, toàn bộ lượng nguyên liệu định mức được hoàn trả lại ngay lập tức vào tồn kho khả dụng.<br>• <b>Bước 5</b>: Giao diện khách hàng cập nhật đồng hồ về 00:00, ẩn nút thanh toán và hiển thị nút Tái tạo đơn tiệc để hỗ trợ khách đặt lại nếu vẫn còn nhu cầu. |
| **Hậu điều kiện (Postconditions)** | Tồn kho nguyên liệu được giải phóng an toàn cho các khách hàng khác tiếp tục đặt. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Cơ chế này loại bỏ 100% nguy cơ khách đặt ảo làm tê liệt nguồn cung nguyên liệu của nhà hàng.* |

---

#### UC-11: THEO DÕI TIẾN ĐỘ CHUẨN BỊ TIỆC VÀ IN HỢP ĐỒNG BIÊN LAI ĐIỆN TỬ

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-11: THEO DÕI TIẾN ĐỘ CHUẨN BỊ TIỆC VÀ IN HỢP ĐỒNG BIÊN LAI ĐIỆN TỬ** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer) |
| **Mô tả tóm tắt (Description)** | Giúp khách hàng theo dõi từng bước phục vụ tiệc của nhà hàng theo thời gian thực và in hợp đồng dịch vụ tiệc hoặc biên lai thu tiền điện tử. |
| **Tiền điều kiện (Preconditions)** | Khách hàng đã đăng nhập và đã có đơn đặt tiệc trên hệ thống. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng vào mục Đơn tiệc của tôi trên thanh điều hướng.<br>• <b>Bước 2</b>: Hệ thống hiển thị danh sách toàn bộ các tiệc đã đặt kèm bộ lọc theo trạng thái: Chờ thanh toán, Đã thanh toán, Đang chuẩn bị, Hoàn thành, Đã hủy.<br>• <b>Bước 3</b>: Khách hàng bấm Xem chi tiết vào một đơn tiệc cụ thể.<br>• <b>Bước 4</b>: Hệ thống hiển thị thanh tiến trình trực quan theo thời gian thực (PAID -> PREPARING -> COMPLETED).<br>• <b>Bước 5</b>: Khách hàng xem lại danh sách món, số tiền giảm giá voucher, tổng thanh toán và có thể bấm nút In hợp đồng tiệc để lưu file PDF hoặc in giấy. |
| **Hậu điều kiện (Postconditions)** | Khách hàng an tâm theo dõi sự kiện của mình và có đủ chứng từ pháp lý dịch vụ tiệc. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Sau khi đơn tiệc đã PAID, khách không thể tự hủy trên web mà phải liên hệ hotline nhà hàng để xử lý thủ công theo hợp đồng.* |

---

### ■ PHÂN HỆ NHÂN VIÊN & BẾP (EMPLOYEE PORTAL)

#### UC-12: TIẾP NHẬN ĐƠN TIỆC ĐÃ THANH TOÁN VÀ KIỂM TRA ĐỊNH MỨC NẤU

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-12: TIẾP NHẬN ĐƠN TIỆC ĐÃ THANH TOÁN VÀ KIỂM TRA ĐỊNH MỨC NẤU** |
| **Phân hệ phụ trách** | Phân hệ Nhân viên & Bếp (Employee Portal) |
| **Tác nhân chính (Primary Actor)** | Nhân viên Bếp, Điều phối viên (Employee) |
| **Mô tả tóm tắt (Description)** | Đội ngũ bếp theo dõi lịch phục vụ tiệc đã thanh toán thành công (PAID) để tiếp nhận phiếu chế biến và chuẩn bị nguyên vật liệu đã xuất kho. |
| **Tiền điều kiện (Preconditions)** | Nhân viên đăng nhập tài khoản nhân viên được cấp và đơn tiệc đã thanh toán hợp lệ. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Nhân viên mở mục Quản lý đơn tiệc bếp tại cổng /employee/orders.<br>• <b>Bước 2</b>: Hệ thống hiển thị danh sách các đơn tiệc PAID sắp tới ngày giờ tổ chức.<br>• <b>Bước 3</b>: Nhân viên bấm vào chi tiết đơn tiệc để xem phiếu chế biến: số lượng bàn, từng món cần nấu, số suất và khối lượng chi tiết từng nguyên liệu đã được xuất kho tự động cho đơn này.<br>• <b>Bước 4</b>: Nhân viên đối chiếu nguyên liệu thực tế tại bếp và chuẩn bị dụng cụ chế biến theo đúng định mức món ăn. |
| **Hậu điều kiện (Postconditions)** | Đội ngũ bếp nắm rõ thực đơn và sẵn sàng cho ca nấu. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Toàn bộ nguyên liệu đã được hệ thống trừ kho vật lý ngay khi khách thanh toán thành công; bếp chỉ lấy đúng số lượng đã ghi trên phiếu chế biến.* |

---

#### UC-13: CẬP NHẬT TIẾN ĐỘ CHẾ BIẾN VÀ HOÀN THÀNH BÀN GIAO TIỆC

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-13: CẬP NHẬT TIẾN ĐỘ CHẾ BIẾN VÀ HOÀN THÀNH BÀN GIAO TIỆC** |
| **Phân hệ phụ trách** | Phân hệ Nhân viên & Bếp (Employee Portal) |
| **Tác nhân chính (Primary Actor)** | Nhân viên Bếp, Quản trị viên (Admin) |
| **Mô tả tóm tắt (Description)** | Cập nhật trạng thái tiến trình thực thi đơn tiệc từ PAID sang PREPARING (Đang nấu) và sang COMPLETED (Hoàn thành bàn giao tiệc). |
| **Tiền điều kiện (Preconditions)** | Đơn tiệc đang ở trạng thái PAID hoặc PREPARING. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khi bắt đầu ca nấu, nhân viên/Admin bấm cập nhật trạng thái đơn sang PREPARING (Đang chuẩn bị). Hệ thống lưu lịch sử và tự động gửi email ORDER_PREPARING cho khách.<br>• <b>Bước 2</b>: Đội ngũ nấu chín món ăn, đóng gói bảo quản và vận chuyển tới địa điểm tổ chức tiệc của khách hàng.<br>• <b>Bước 3</b>: Sau khi buổi tiệc kết thúc tốt đẹp và khách hàng đã nghiệm thu dịch vụ, nhân viên/Admin mở chi tiết đơn và bấm cập nhật sang COMPLETED (Hoàn thành).<br>• <b>Bước 4</b>: Hệ thống ghi nhận thời điểm hoàn tất, gửi email ORDER_COMPLETED cho khách và mở khóa chức năng đánh giá chất lượng món ăn. |
| **Hậu điều kiện (Postconditions)** | Đơn tiệc chính thức hoàn thành toàn bộ chu trình phục vụ sự kiện. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Chỉ những đơn hàng đã thanh toán (PAID) mới được phép chuyển trạng thái theo luồng: PAID -> PREPARING -> COMPLETED.* |

---

#### UC-14: NHÂN VIÊN THỰC HIỆN CHẤM CÔNG CA LÀM VIỆC HÀNG NGÀY

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-14: NHÂN VIÊN THỰC HIỆN CHẤM CÔNG CA LÀM VIỆC HÀNG NGÀY** |
| **Phân hệ phụ trách** | Phân hệ Nhân viên (Employee Portal) |
| **Tác nhân chính (Primary Actor)** | Nhân viên nhà hàng (Employee) |
| **Mô tả tóm tắt (Description)** | Ghi nhận ngày làm việc thực tế của nhân viên trên giao diện Self-Service làm căn cứ tính bảng lương tự động vào cuối tháng. |
| **Tiền điều kiện (Preconditions)** | Nhân viên đã đến nhà hàng hoặc địa điểm tổ chức tiệc làm việc. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Nhân viên đăng nhập và truy cập trang Chấm công cá nhân (/employee/my-attendance).<br>• <b>Bước 2</b>: Nhân viên bấm nút Chấm công vào ca khi bắt đầu làm việc.<br>• <b>Bước 3</b>: Hệ thống ghi nhận thời gian vào ca thực tế.<br>• <b>Bước 4</b>: Khi kết thúc ca làm việc, nhân viên bấm Chấm công tan ca.<br>• <b>Bước 5</b>: Hệ thống lưu lại bản ghi ngày công (Đủ ca, Nửa ca) vào cơ sở dữ liệu để phục vụ kỳ tính lương. |
| **Hậu điều kiện (Postconditions)** | Dữ liệu chấm công trong ngày của nhân viên được lưu lại minh bạch. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Admin cũng có thể chấm công trực tiếp cho nhân viên trên màn hình quản trị chấm công với các mức 0 công, 0.5 công hoặc 1 công.* |

---

#### UC-15: NHÂN VIÊN TRA CỨU PHIẾU LƯƠNG CÁ NHÂN HÀNG THÁNG

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-15: NHÂN VIÊN TRA CỨU PHIẾU LƯƠNG CÁ NHÂN HÀNG THÁNG** |
| **Phân hệ phụ trách** | Phân hệ Nhân viên (Employee Portal) |
| **Tác nhân chính (Primary Actor)** | Nhân viên nhà hàng (Employee) |
| **Mô tả tóm tắt (Description)** | Giúp nhân viên minh bạch theo dõi chi tiết số ngày công, lương cơ bản, các khoản phụ cấp, thưởng phạt và mức lương thực nhận mỗi tháng. |
| **Tiền điều kiện (Preconditions)** | Ban giám đốc đã phê duyệt bảng lương của kỳ tháng tương ứng. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Nhân viên truy cập mục Phiếu lương của tôi (/employee/my-payrolls).<br>• <b>Bước 2</b>: Hệ thống hiển thị danh sách các kỳ lương hàng tháng đã được Ban giám đốc phê duyệt.<br>• <b>Bước 3</b>: Nhân viên bấm xem chi tiết kỳ lương mong muốn: hệ thống hiển thị rõ ràng số ngày công thực tế, lương tháng cơ bản, tiền phụ cấp trách nhiệm, tiền thưởng sự kiện tiệc, các khoản giảm trừ và tổng số tiền thực nhận. |
| **Hậu điều kiện (Postconditions)** | Nhân viên nắm rõ thu nhập hàng tháng một cách rõ ràng, không có tranh chấp khiếu nại. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Nhân viên có thể xuất phiếu lương ra dạng tài liệu để lưu trữ cá nhân.* |

---

### ■ PHÂN HỆ QUẢN TRỊ TRUNG TÂM (ADMIN PORTAL)

#### UC-16: QUẢN LÝ DANH MỤC MÓN ĂN VÀ ĐỊNH MỨC NGUYÊN LIỆU (BOM)

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-16: QUẢN LÝ DANH MỤC MÓN ĂN VÀ ĐỊNH MỨC NGUYÊN LIỆU (BOM)** |
| **Phân hệ phụ trách** | Phân hệ Quản trị (Admin Portal) |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin) |
| **Mô tả tóm tắt (Description)** | Cấu hình danh mục món ăn hiển thị trên website và thiết lập công thức chi tiết từng gam nguyên liệu cấu thành (Bill of Materials) cho mỗi món ăn. |
| **Tiền điều kiện (Preconditions)** | Quản trị viên đăng nhập bằng tài khoản Quản trị cấp cao (ROLE_ADMIN). |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Admin mở trang Quản lý Thực đơn & Món ăn tại phân hệ quản trị.<br>• <b>Bước 2</b>: Admin thêm món ăn mới: nhập tên món, phân nhóm món, tải ảnh món chất lượng cao, đặt đơn giá cho 1 phần ăn.<br>• <b>Bước 3</b>: Admin thiết lập công thức định mức (BOM): chọn các nguyên liệu từ kho và nhập định lượng chuẩn xác (ví dụ: Món Bò né cần 0.8kg thịt bò, 0.1kg bơ, 0.2kg hành tây).<br>• <b>Bước 4</b>: Hệ thống tự động tính giá vốn lý thuyết của món dựa trên đơn giá vốn bình quân hiện tại của các nguyên liệu cấu thành.<br>• <b>Bước 5</b>: Admin bấm Lưu món ăn. Món ăn mới xuất hiện công khai trên website cho khách hàng chọn đặt. |
| **Hậu điều kiện (Postconditions)** | Món ăn và công thức định mức được lưu trữ, làm nền tảng cho việc kiểm tra tồn kho và xuất trừ kho tự động. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Hệ thống chặn việc mở bán món ăn nếu món đó chưa được khai báo ít nhất một nguyên liệu trong công thức định mức.* |

---

#### UC-17: LẬP PHIẾU NHẬP KHO NGUYÊN LIỆU VÀ TÍNH GIÁ VỐN BÌNH QUÂN GIA QUYỀN

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-17: LẬP PHIẾU NHẬP KHO NGUYÊN LIỆU VÀ TÍNH GIÁ VỐN BÌNH QUÂN GIA QUYỀN** |
| **Phân hệ phụ trách** | Phân hệ Quản trị (Admin Portal) |
| **Tác nhân chính (Primary Actor)** | Quản trị viên, Thủ kho (Admin) |
| **Mô tả tóm tắt (Description)** | Nhập hàng hóa nguyên liệu từ nhà cung cấp vào kho, hệ thống tự động cộng dồn tồn kho vật lý và tính lại đơn giá vốn bình quân gia quyền di động. |
| **Tiền điều kiện (Preconditions)** | Hàng hóa nguyên liệu được nhà cung cấp giao tới cửa kho nhà hàng. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Admin mở trang Nhập hàng và bấm Tạo phiếu nhập mới.<br>• <b>Bước 2</b>: Admin chọn Nhà cung cấp thực phẩm từ danh sách đối tác tin cậy.<br>• <b>Bước 3</b>: Admin thêm từng dòng nguyên liệu: chọn tên mặt hàng, số lượng nhập theo đơn vị chuẩn và đơn giá mua thực tế trên hóa đơn.<br>• <b>Bước 4</b>: Hệ thống tự động tính tổng tiền phiếu nhập và hiển thị số tiền phải trả.<br>• <b>Bước 5</b>: Thủ kho kiểm tra hàng thực tế tại kho và bấm Xác nhận nhập kho.<br>• <b>Bước 6</b>: Hệ thống tự động cộng số lượng vào tồn kho vật lý, áp dụng công thức Bình quân gia quyền di động tính lại đơn giá vốn mới cho từng nguyên liệu, ghi nhật ký StockMovement (IMPORT) và lưu công nợ. |
| **Hậu điều kiện (Postconditions)** | Tồn kho nguyên liệu tăng lên và giá vốn mới được áp dụng ngay lập tức cho các phép tính hạch toán chi phí xuất kho. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Công thức bình quân gia quyền: Đơn giá mới = (Tổng giá trị tồn cũ + Giá trị nhập mới) / (Số lượng tồn cũ + Số lượng nhập mới).* |

---

#### UC-18: GIÁM SÁT TỒN KHO KHẢ DỤNG VÀ CẢNH BÁO NGUYÊN LIỆU SẮP HẾT

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-18: GIÁM SÁT TỒN KHO KHẢ DỤNG VÀ CẢNH BÁO NGUYÊN LIỆU SẮP HẾT** |
| **Phân hệ phụ trách** | Phân hệ Quản trị (Admin Portal) |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin) |
| **Mô tả tóm tắt (Description)** | Theo dõi số lượng hàng hóa trong kho theo thời gian thực để kịp thời nhập thêm hàng, đảm bảo không bị gián đoạn hoạt động kinh doanh tiệc. |
| **Tiền điều kiện (Preconditions)** | Quản trị viên truy cập trang Tổng quan kho & Nguyên liệu. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Admin mở trang Tổng quan kho & Nguyên liệu tại menu bên trái.<br>• <b>Bước 2</b>: Hệ thống hiển thị danh mục toàn bộ nguyên liệu kèm 3 chỉ số cốt lõi: Tồn vật lý trong kho, Lượng đang bị các đơn giữ chỗ tạm 15 phút, và Tồn khả dụng thực tế sẵn sàng nhận tiệc mới.<br>• <b>Bước 3</b>: Các nguyên liệu có số tồn thấp hơn mức an toàn tối thiểu (min_stock) được hệ thống tự động gắn nhãn cảnh báo đỏ Cần nhập thêm hàng.<br>• <b>Bước 4</b>: Admin có thể bấm vào từng nguyên liệu để xem chi tiết lịch sử nhập xuất tại Sổ biến động kho. |
| **Hậu điều kiện (Postconditions)** | Quản trị viên nắm bắt chính xác hiện trạng kho hàng và chủ động kế hoạch nhập hàng. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Tồn khả dụng = Tồn vật lý - Lượng giữ chỗ của các đơn chờ thanh toán chưa hết hạn.* |

---

#### UC-19: QUẢN LÝ CHIẾN DỊCH ƯU ĐÃI VÀ CẤU HÌNH HẠN MỨC VOUCHER

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-19: QUẢN LÝ CHIẾN DỊCH ƯU ĐÃI VÀ CẤU HÌNH HẠN MỨC VOUCHER** |
| **Phân hệ phụ trách** | Phân hệ Quản trị (Admin Portal) |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin) |
| **Mô tả tóm tắt (Description)** | Tạo mới và kiểm soát các chương trình khuyến mại, mã giảm giá để kích cầu đặt tiệc mà vẫn bảo đảm an toàn tài chính cho nhà hàng. |
| **Tiền điều kiện (Preconditions)** | Quản trị viên mở trang Quản lý Voucher. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Admin bấm vào mục Quản lý Voucher trên thanh điều hướng.<br>• <b>Bước 2</b>: Hệ thống hiển thị bảng thống kê tổng số voucher, voucher đang chạy và tổng lượt sử dụng của khách.<br>• <b>Bước 3</b>: Admin bấm nút Thêm voucher mới và nhập các tham số: Mã voucher, Tên chương trình, Hình thức giảm (% hoặc tiền mặt), Giá trị giảm, Giới hạn giảm tối đa, Giá trị đơn tối thiểu (minOrderAmount), Tổng lượt dùng toàn sàn, Lượt tối đa/khách và Hạn dùng.<br>• <b>Bước 4</b>: Admin bấm Lưu voucher. Mã voucher mới lập tức đi vào hoạt động.<br>• <b>Bước 5</b>: Admin có thể bật/tắt nhanh trạng thái tạm dừng áp dụng của một voucher bất kỳ lúc nào ngay trên bảng danh sách mà không cần xóa mã. |
| **Hậu điều kiện (Postconditions)** | Mã voucher mới được áp dụng trên toàn hệ thống đặt tiệc. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Cơ chế giới hạn mức giảm tối đa bảo vệ nhà hàng khỏi rủi ro thất thoát doanh thu khi khách đặt các đơn tiệc quy mô lớn.* |

---

#### UC-20: GIÁM SÁT VÀ ĐỐI SOÁT DÒNG TIỀN GIAO DỊCH NGÂN HÀNG SEPAY

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-20: GIÁM SÁT VÀ ĐỐI SOÁT DÒNG TIỀN GIAO DỊCH NGÂN HÀNG SEPAY** |
| **Phân hệ phụ trách** | Phân hệ Quản trị & Tài chính |
| **Tác nhân chính (Primary Actor)** | Quản trị viên, Kế toán trưởng (Admin) |
| **Mô tả tóm tắt (Description)** | Giám sát toàn bộ dòng tiền thanh toán chuyển khoản qua SePay, xử lý ngoại lệ chuyển khoản chậm hoặc sai nội dung. |
| **Tiền điều kiện (Preconditions)** | Kế toán mở trang Thanh toán & Đối soát. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Kế toán mở mục Thanh toán & Đối soát tại phân hệ quản trị.<br>• <b>Bước 2</b>: Hệ thống hiển thị danh sách toàn bộ các giao dịch chuyển khoản ngân hàng tự động kèm trạng thái đối soát: Đã khớp đơn tự động, Chờ đối soát (PAYMENT_REVIEW), hoặc Chưa khớp.<br>• <b>Bước 3</b>: Kế toán kiểm tra mã tham chiếu ngân hàng, số tiền thực nhận và mã đơn tiệc tương ứng.<br>• <b>Bước 4</b>: Trường hợp khách hàng chuyển khoản muộn khi đơn đã quá hạn 15 phút nhưng kho vẫn đủ nguyên liệu phục vụ, kế toán bấm nút Xác nhận kích hoạt đơn thủ công để kích hoạt đơn cho khách.<br>• <b>Bước 5</b>: Hệ thống ghi nhận lịch sử duyệt của kế toán và chuyển đơn sang trạng thái PAID an toàn. |
| **Hậu điều kiện (Postconditions)** | Dòng tiền vào tài khoản ngân hàng được đối soát 100% minh bạch. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Mọi thao tác kích hoạt đơn thủ công đều được lưu vết chi tiết người thực hiện để phục vụ kiểm toán nội bộ.* |

---

#### UC-21: QUẢN TRỊ HỒ SƠ NHÂN SỰ, DUYỆT CÔNG VÀ TỰ ĐỘNG TÍNH BẢNG LƯƠNG

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-21: QUẢN TRỊ HỒ SƠ NHÂN SỰ, DUYỆT CÔNG VÀ TỰ ĐỘNG TÍNH BẢNG LƯƠNG** |
| **Phân hệ phụ trách** | Phân hệ Quản trị & Nhân sự |
| **Tác nhân chính (Primary Actor)** | Quản trị viên, Trưởng phòng Nhân sự (Admin) |
| **Mô tả tóm tắt (Description)** | Quản lý nhân viên nhà hàng, phê duyệt dữ liệu chấm công và tự động tính toán bảng lương thực nhận mỗi tháng theo công thức chuẩn. |
| **Tiền điều kiện (Preconditions)** | Đến kỳ tổng kết công và tính lương cuối tháng của nhà hàng. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Admin mở trang Quản lý nhân viên để quản lý hồ sơ nhân sự: hợp đồng, chức vụ, mức lương cơ bản và tài khoản hệ thống.<br>• <b>Bước 2</b>: Cuối tháng, Admin mở trang Chấm công để rà soát và duyệt bảng công tổng hợp của toàn thể nhân viên.<br>• <b>Bước 3</b>: Admin chuyển sang mục Kỳ lương, tạo kỳ lương tháng mới và bấm nút Tính toán bảng lương tự động.<br>• <b>Bước 4</b>: Hệ thống tự động quét số ngày công thực tế của từng nhân viên, tính ra lương thời gian theo công thức: Lương cơ bản x Công thực tế / Công chuẩn (26) + Phụ cấp - Khấu trừ.<br>• <b>Bước 5</b>: Admin kiểm tra lại các con số, sau đó bấm Phê duyệt bảng lương để phát hành phiếu lương cho nhân viên và chuyển số liệu sang kế toán chi tiền. |
| **Hậu điều kiện (Postconditions)** | Bảng lương tháng được duyệt, phiếu lương cá nhân được phát hành và chi phí nhân sự được ghi nhận vào báo cáo tài chính. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Hệ thống cho phép cấu hình linh hoạt các mức phụ cấp chức vụ và tiền thưởng sự kiện tiệc cho từng nhân viên.* |

---

#### UC-22: BÁO CÁO TÀI CHÍNH DOANH THU, CHI PHÍ GIÁ VỐN VÀ LỢI NHUẬN (P&L)

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-22: BÁO CÁO TÀI CHÍNH DOANH THU, CHI PHÍ GIÁ VỐN VÀ LỢI NHUẬN (P&L)** |
| **Phân hệ phụ trách** | Phân hệ Quản trị & Báo cáo |
| **Tác nhân chính (Primary Actor)** | Quản trị viên, Giám đốc điều hành (Admin) |
| **Mô tả tóm tắt (Description)** | Cung cấp bức tranh tài chính toàn diện giúp chủ nhà hàng nắm rõ doanh thu thuần, giá vốn hàng bán (COGS), chi phí nhân sự và lợi nhuận ròng của từng tháng. |
| **Tiền điều kiện (Preconditions)** | Quản trị viên truy cập trang Báo cáo lợi nhuận (P&L) hoặc Báo cáo dòng tiền. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Admin mở trang Báo cáo lợi nhuận (P&L) trên menu báo cáo.<br>• <b>Bước 2</b>: Admin lựa chọn khoảng thời gian cần phân tích (theo tháng, theo quý hoặc theo năm).<br>• <b>Bước 3</b>: Hệ thống tự động tổng hợp số liệu từ các phân hệ: Doanh thu thực tế từ các đơn tiệc đã phục vụ hoàn tất (sau khi trừ chiết khấu voucher), Chi phí giá vốn nguyên liệu xuất kho theo đơn giá bình quân gia quyền tại thời điểm xuất, Chi phí lương nhân viên đã duyệt trong kỳ, và Chi phí vận hành khác.<br>• <b>Bước 4</b>: Hệ thống tính toán các chỉ số kinh doanh then chốt: Lợi nhuận gộp, Tỷ suất lợi nhuận gộp và Lợi nhuận thuần thực tế (Net Profit).<br>• <b>Bước 5</b>: Giao diện hiển thị biểu đồ trực quan (cơ cấu doanh thu chi phí, biểu đồ tăng trưởng qua các tháng) và bảng số liệu phân tích chi tiết để hỗ trợ việc ra quyết định kinh doanh. |
| **Hậu điều kiện (Postconditions)** | Ban giám đốc có được báo cáo tài chính chính xác, minh bạch để định hướng chiến lược kinh doanh. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Tiền nhập kho nguyên liệu chưa dùng KHÔNG được tính vào giá vốn của Báo cáo P&L để tránh tính trùng hai lần.* |

---

## PHẦN V: TỔNG KẾT VÀ NGUYÊN TẮC THIẾT KẾ HỆ THỐNG

| Nguyên tắc / Đột phá | Giá trị thực tiễn trong vận hành nhà hàng tiệc |
| :--- | :--- |
| **Tự động hóa thanh toán 100% Napas SePay & Trừ kho tức thì** | Loại bỏ hoàn toàn quy trình duyệt bill chuyển khoản thủ công. Ngay khi khách chuyển tiền qua mã QR Napas 24/7, cổng SePay phát Webhook xác thực tức thì: hệ thống tự động trừ tồn kho vật lý (current_stock), chốt giá vốn nguyên liệu (COGS) tại thời điểm xuất kho và chuyển đơn sang PAID trong vòng vài giây. |
| **Cơ chế bảo vệ kho chống đặt giữ ảo (15 phút)** | Khi bấm Xác nhận đặt tiệc, kho nguyên liệu tự động khóa giữ trong đúng 15 phút (StockReservation = ACTIVE). Nếu khách không thanh toán, scheduler tự động hủy đơn và giải phóng 100% nguyên liệu về lại tồn khả dụng. |
| **Bóc tách định mức BOM & Giá vốn bình quân di động** | Mỗi món ăn đều gắn liền với công thức định mức nguyên liệu (Bill of Materials). Khi nhập hàng, hệ thống tự động tính lại đơn giá vốn bình quân gia quyền di động, giúp xác định chuẩn xác 100% giá vốn của từng buổi tiệc khi xuất kho. |
| **Phân định rạch ròi giữa Dòng tiền (Cashflow) & Lợi nhuận (P&L)** | Hệ thống tự động liên kết Doanh thu tiệc thực tế, Chi phí giá vốn nguyên liệu xuất kho và Chi phí lương nhân sự đã duyệt để kết xuất Báo cáo Dòng tiền và Báo cáo Lợi nhuận (P&L) theo từng tháng. Tiền mua nguyên liệu nhập kho chưa dùng KHÔNG bị tính vào giá vốn để tránh tính trùng hai lần. |