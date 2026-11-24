# TÀI LIỆU ĐẶC TẢ USE CASE & CÁC LUỒNG NGHIỆP VỤ HỆ THỐNG
## NỀN TẢNG ĐẶT TIỆC CƯỚI & QUẢN TRỊ VẬN HÀNH ẨM THỰC BANQUETHUB

| Hạng mục | Thông tin chi tiết |
| :--- | :--- |
| **Đề tài áp dụng** | BanquetHub - Nền tảng Đặt Tiệc Cưới & Quản Trị Vận Hành Ẩm Thực Tập Trung |
| **Tài liệu dùng cho** | Báo cáo Đồ án Tốt nghiệp / Tài liệu Thiết kế & Đặc tả Kiến trúc Phần mềm |
| **Tác giả biên soạn** | Trần Văn Khiên (Email: tranzankhien@gmail.com) |
| **Hình thức trình bày** | Bảng đặc tả Use Case chuẩn công nghệ phần mềm & Khối luồng nghiệp vụ văn xuôi (Không chèn mã code, không chèn cú pháp vẽ hình) |
| **Ngày hoàn thiện** | 24/11/2026 — Phiên bản chuẩn 2.0 (Official) |

---

## PHẦN I: TỔNG QUAN CÁC TÁC NHÂN TRONG HỆ THỐNG (ACTORS)

| Tác nhân (Actor) | Phân loại | Mô tả vai trò & Trách nhiệm trong hệ thống |
| :--- | :--- | :--- |
| **Khách hàng (Customer)** | Tác nhân người dùng (Bên ngoài) | Người dùng truy cập website: duyệt món, tự phối set menu tiệc, nhận tư vấn AI, chọn địa điểm tổ chức trên bản đồ Mapbox, nhập mã ưu đãi Voucher, thanh toán 100% qua Napas QR và theo dõi đơn. |
| **Nhân viên Bếp & Điều phối (Employee)** | Tác nhân nội bộ (Nhà hàng) | Đội ngũ chế biến và phục vụ: tiếp nhận đơn tiệc đã thanh toán thành công, bóc tách nguyên liệu kho để nấu, cập nhật tiến độ chế biến, hoàn tất bàn giao tiệc, chấm công hàng ngày và tra cứu bảng lương. |
| **Quản trị viên (Admin)** | Tác nhân nội bộ (Ban quản lý) | Chủ nhà hàng / Ban điều hành nắm toàn quyền: quản lý thực đơn & định mức BOM, nhập kho nguyên liệu và quản lý giá vốn bình quân, cấu hình voucher, đối soát tiền SePay, duyệt bảng lương và theo dõi báo cáo P&L. |
| **Cổng thanh toán SePay PG** | Tác nhân hệ thống (Bên thứ ba) | Hệ thống trung gian thanh toán tự động, cung cấp mã QR chuyển khoản liên ngân hàng 24/7 và phát tín hiệu Webhook tức thì về BanquetHub khi có biến động số dư thành công. |
| **Trợ lý AI Google Gemini** | Tác nhân trí tuệ nhân tạo | Mô hình ngôn ngữ lớn tiếp nhận dữ liệu tồn kho và danh mục món ăn thực tế để tư vấn phối set menu tiệc tối ưu theo ngân sách, khẩu vị và giải đáp các quy định của nhà hàng. |

---

## PHẦN II: CHI TIẾT 6 LUỒNG NGHIỆP VỤ CHÍNH TOÀN HỆ THỐNG (CORE BUSINESS FLOWS)

### ★ FLOW-01: Luồng Khách hàng Đặt tiệc & Thanh toán trực tuyến 100% (Order & Payment Flow)

- **Mục tiêu nghiệp vụ**: Tự động hóa toàn bộ quy trình đặt tiệc từ lúc chọn món, bóc tách kho, áp mã ưu đãi đến khi tiền về tài khoản ngân hàng tức thì.
- **Tác nhân tham gia**: Khách hàng, Cổng thanh toán SePay PG, Hệ thống kiểm tra kho tự động
- **Điểm kích hoạt**: Khách hàng truy cập trang web để tìm món và phối thực đơn tiệc.
- **Kết quả đầu ra**: Đơn tiệc được xác nhận Đã thanh toán, khóa giữ nguyên liệu vĩnh viễn, gửi biên lai & hợp đồng điện tử.

| Bước thực hiện | Chi tiết diễn tiến & Phản hồi của Hệ thống BanquetHub |
| :--- | :--- |
| **Bước 1: Chọn số bàn và món ăn** | Khách hàng mở công cụ Tự phối thực đơn (Menu Builder), chọn số lượng bàn tiệc (tối thiểu 1 bàn) và lựa chọn các món ăn theo từng nhóm khai vị, món chính, lẩu, tráng miệng, đồ uống. |
| **Bước 2: Bóc tách tồn kho tự động** | Ngay khi khách thêm món, hệ thống tự động bóc tách định mức nguyên liệu (BOM) và kiểm tra tồn kho sẵn có. Nếu đủ nguyên liệu, hệ thống tính toán tổng tiền và mở nút tiếp tục. |
| **Bước 3: Nhập mã Voucher ưu đãi** | Tại bước thanh toán, khách hàng tự nhập mã giảm giá (ví dụ: TIECXUAN2026). Hệ thống kiểm tra điều kiện (hạn dùng, đơn tối thiểu, số lượt còn lại) và trừ tiền chiết khấu trực tiếp vào tổng tiền. |
| **Bước 4: Định vị địa chỉ tổ chức tiệc** | Khách hàng gõ địa chỉ tổ chức; hệ thống gợi ý địa điểm chuẩn xác từ Mapbox và ghim vị trí kinh độ/vĩ độ trên bản đồ số để phục vụ điều phối sau này. |
| **Bước 5: Kích hoạt Lệnh giữ kho 15 phút** | Khách hàng bấm Xác nhận đặt tiệc. Hệ thống tạo đơn hàng mới ở trạng thái Chờ thanh toán và kích hoạt Lệnh giữ chỗ nguyên liệu kho (Hold Stock) trong thời hạn 15 phút kèm đồng hồ đếm ngược. |
| **Bước 6: Quét mã Napas 24/7 SePay** | Khách bấm Thanh toán ngay qua SePay; màn hình hiển thị mã QR thanh toán chuẩn Napas chuyển khoản liên ngân hàng với số tiền chính xác 100% và nội dung chuyển khoản định danh. |
| **Bước 7: Kích hoạt đơn hàng tức thì** | Ngay khi ngân hàng báo có, SePay gửi Webhook về BanquetHub. Hệ thống khớp đúng 100% số tiền, tự động chuyển đơn sang Đã thanh toán, khóa kho vĩnh viễn và xuất biên lai. |
| **Xử lý ngoại lệ / Lưu ý** | *Nếu quá 15 phút khách không thanh toán, tác vụ ngầm tự động hủy đơn và hoàn trả 100% lượng nguyên liệu đã giữ về tồn kho sẵn có.* |

---

### ★ FLOW-02: Luồng Điều phối & Chế biến món tiệc tại Bếp (Kitchen Order Processing & Fulfillment Flow)

- **Mục tiêu nghiệp vụ**: Quản trị quy trình chế biến món ăn chuẩn định mức, xuất kho nguyên liệu vật lý đúng thời điểm và nghiệm thu hoàn thành sự kiện.
- **Tác nhân tham gia**: Nhân viên Bếp, Đội ngũ Điều phối phục vụ sự kiện, Quản trị viên
- **Điểm kích hoạt**: Đơn tiệc chuyển sang trạng thái Đã thanh toán thành công.
- **Kết quả đầu ra**: Các món ăn được nấu chín, phục vụ trọn vẹn tại sự kiện, kho vật lý được xuất trừ và giá vốn được hạch toán.

| Bước thực hiện | Chi tiết diễn tiến & Phản hồi của Hệ thống BanquetHub |
| :--- | :--- |
| **Bước 1: Tiếp nhận đơn tiệc** | Đội ngũ Bếp mở màn hình Quản lý đơn tiệc bếp, xem danh sách các tiệc đã thanh toán hợp lệ kèm thời gian và địa điểm tổ chức. |
| **Bước 2: Bóc tách nguyên liệu nấu** | Nhân viên bấm vào chi tiết đơn tiệc để xem bảng kê khối lượng từng loại nguyên liệu cần xuất từ kho theo định mức chuẩn (BOM) nhân với số bàn. |
| **Bước 3: Bắt đầu chế biến** | Nhân viên bấm Bắt đầu chế biến tiệc. Hệ thống chuyển trạng thái đơn sang Đang chuẩn bị tiệc (IN_PROGRESS) và xuất kho nguyên liệu thực tế cho ca nấu. |
| **Bước 4: Phục vụ tại sự kiện** | Đội ngũ vận chuyển món và nhân viên phục vụ bàn triển khai bày tiệc tại địa điểm đã ghim trên bản đồ Mapbox của khách hàng. |
| **Bước 5: Nghiệm thu & Hoàn thành** | Sau khi tiệc kết thúc tốt đẹp và khách hàng ký biên bản nghiệm thu dịch vụ, nhân viên bấm Xác nhận hoàn thành tiệc. Đơn chuyển trạng thái Hoàn thành (COMPLETED). |
| **Xử lý ngoại lệ / Lưu ý** | *Nếu phát sinh sự cố tại điểm tiệc, nhân viên ghi chú biên bản sự vụ trên hệ thống để Ban quản lý đối soát và giải quyết theo hợp đồng.* |

---

### ★ FLOW-03: Luồng Quản trị kho & Nhập hàng nguyên liệu (Inventory & Purchasing Flow)

- **Mục tiêu nghiệp vụ**: Đảm bảo kho luôn đủ nguyên liệu cung ứng cho các tiệc, chống gián đoạn kinh doanh và kiểm soát chặt chẽ giá vốn nhập hàng.
- **Tác nhân tham gia**: Quản trị viên, Thủ kho, Nhà cung cấp thực phẩm
- **Điểm kích hoạt**: Hệ thống phát cảnh báo nguyên liệu dưới định mức an toàn hoặc có kế hoạch tiệc lớn.
- **Kết quả đầu ra**: Số lượng nguyên liệu trong kho tăng lên, giá vốn bình quân được cập nhật lại và công nợ nhà cung cấp được ghi nhận.

| Bước thực hiện | Chi tiết diễn tiến & Phản hồi của Hệ thống BanquetHub |
| :--- | :--- |
| **Bước 1: Giám sát tồn kho an toàn** | Quản trị viên theo dõi bảng Tổng quan kho; các nguyên liệu chạm ngưỡng tối thiểu được tự động đánh dấu Cảnh báo đỏ. |
| **Bước 2: Lập phiếu nhập kho mới** | Thủ kho bấm Tạo phiếu nhập mới, lựa chọn Nhà cung cấp từ danh bạ đối tác tin cậy. |
| **Bước 3: Khai báo nguyên liệu nhập** | Thủ kho thêm từng mặt hàng, nhập số lượng cân/hộp và đơn giá mua thực tế trên hóa đơn. Hệ thống tự tính tổng tiền phiếu nhập. |
| **Bước 4: Xác nhận nhập kho thực tế** | Thủ kho kiểm tra hàng thực tế tại cửa kho, nhập số tiền đã thanh toán cho nhà cung cấp và bấm Xác nhận nhập kho. |
| **Bước 5: Cập nhật giá vốn bình quân** | Hệ thống tự động cộng dồn số lượng vào tồn kho thực tế, tính toán lại đơn giá vốn bình quân gia quyền mới (Weighted Average Cost) cho từng nguyên liệu, ghi nhật ký Sổ biến động kho và lưu công nợ. |
| **Xử lý ngoại lệ / Lưu ý** | *Nếu hàng giao bị lỗi hỏng hoặc thiếu cân, thủ kho từ chối nhận dòng nguyên liệu đó trên phiếu nhập để bảo vệ chất lượng tiệc.* |

---

### ★ FLOW-04: Luồng Quản trị Nhân sự, Chấm công & Tính lương tự động (HR, Attendance & Payroll Flow)

- **Mục tiêu nghiệp vụ**: Tự động hóa hoàn toàn việc tính lương dựa trên dữ liệu chấm công thực tế, đảm bảo minh bạch, chính xác và giảm thiểu sai sót thủ công.
- **Tác nhân tham gia**: Nhân viên nhà hàng, Quản trị viên / Phòng Nhân sự, Kế toán trưởng
- **Điểm kích hoạt**: Nhân viên làm việc hàng ngày và chu kỳ chốt lương cuối tháng của nhà hàng.
- **Kết quả đầu ra**: Bảng lương tháng được phê duyệt, phiếu lương cá nhân được phát hành và chi phí nhân sự được ghi nhận vào báo cáo tài chính.

| Bước thực hiện | Chi tiết diễn tiến & Phản hồi của Hệ thống BanquetHub |
| :--- | :--- |
| **Bước 1: Chấm công hàng ngày** | Nhân viên mở trang Chấm công cá nhân, bấm Chấm công vào ca khi đến làm việc và Chấm công tan ca khi kết thúc ca. |
| **Bước 2: Giám sát & Duyệt công** | Quản lý nhân sự theo dõi bảng công tổng hợp toàn viện, kiểm tra tính chuyên cần (Đi đủ, Nửa ca, Nghỉ phép). |
| **Bước 3: Khởi tạo kỳ lương tháng** | Đến cuối tháng, Quản trị viên vào mục Kỳ lương, chọn tháng cần tính và bấm Tính toán bảng lương tự động. |
| **Bước 4: Tự động tính toán lương** | Hệ thống tự động lấy số ngày công thực tế nhân với lương cơ bản, cộng phụ cấp trách nhiệm, cộng thưởng sự kiện tiệc và trừ phạt/tạm ứng. |
| **Bước 5: Phê duyệt & Chi trả lương** | Ban giám đốc kiểm tra bảng tổng hợp lương, bấm Phê duyệt bảng lương để phát hành phiếu lương cho nhân viên và chuyển số liệu cho kế toán chi tiền. |
| **Xử lý ngoại lệ / Lưu ý** | *Nếu có khiếu nại về ngày công, Admin có thể điều chỉnh trực tiếp bản ghi chấm công kèm lý do giải trình trước khi bấm duyệt kỳ lương.* |

---

### ★ FLOW-05: Luồng Quản trị Chiến dịch Ưu đãi & Áp dụng Voucher (Voucher Campaign & Discount Flow)

- **Mục tiêu nghiệp vụ**: Kích thích nhu cầu đặt tiệc của khách hàng trong khi vẫn duy trì ngưỡng an toàn tài chính qua các giới hạn mức giảm tối đa và đơn tối thiểu.
- **Tác nhân tham gia**: Quản trị viên, Khách hàng đặt tiệc
- **Điểm kích hoạt**: Nhà hàng phát động chương trình khuyến mãi theo mùa hoặc sự kiện tri ân khách hàng.
- **Kết quả đầu ra**: Khách hàng được hưởng chiết khấu hợp lệ, số tiền thanh toán giảm xuống và số lượt dùng voucher được ghi nhận chính xác.

| Bước thực hiện | Chi tiết diễn tiến & Phản hồi của Hệ thống BanquetHub |
| :--- | :--- |
| **Bước 1: Cấu hình mã voucher mới** | Admin vào trang Quản lý Voucher, bấm Thêm voucher mới và nhập: Mã voucher (ví dụ: TIECXUAN2026), hình thức giảm (tiền cố định hoặc %), giá trị giảm, mức giảm tối đa, giá trị đơn tối thiểu, tổng lượt dùng toàn sàn, số lượt tối đa/khách và ngày hết hạn. |
| **Bước 2: Kích hoạt chương trình** | Admin lưu voucher; hệ thống đưa voucher vào trạng thái Hoạt động và sẵn sàng thẩm định mã khi khách hàng sử dụng. |
| **Bước 3: Khách hàng nhập mã thủ công** | Tại màn hình thanh toán, khách hàng tự gõ mã voucher vào ô khuyến mãi (không hiển thị danh sách chọn sẵn để bảo mật mã). |
| **Bước 4: Thẩm định điều kiện tức thì** | Hệ thống kiểm tra: mã có tồn tại, còn trong hạn, tổng tiền đơn có đạt ngưỡng tối thiểu và khách chưa dùng quá giới hạn hay không. |
| **Bước 5: Áp dụng chiết khấu & Khóa mã** | Hệ thống tính số tiền được giảm, hiển thị dòng chiết khấu màu xanh nổi bật và trừ tiền trực tiếp vào tổng đơn. Khi khách thanh toán thành công, hệ thống tăng số lượt đã dùng của voucher lên 1 đơn vị. |
| **Xử lý ngoại lệ / Lưu ý** | *Nếu khách thay đổi số lượng bàn tiệc khiến tổng tiền rơi xuống dưới mức tối thiểu của voucher, hệ thống tự động hủy áp dụng mã và thông báo rõ ràng.* |

---

### ★ FLOW-06: Luồng Đối soát Dòng tiền & Báo cáo Lợi nhuận P&L (Cashflow Reconciliation & P&L Reporting Flow)

- **Mục tiêu nghiệp vụ**: Cung cấp bức tranh toàn cảnh về sức khỏe tài chính của nhà hàng: dòng tiền vào từ tiệc, dòng tiền ra chi nguyên liệu và lương, cùng tỷ suất lợi nhuận ròng.
- **Tác nhân tham gia**: Quản trị viên, Kế toán trưởng, Giám đốc điều hành
- **Điểm kích hoạt**: Giao dịch thanh toán ngân hàng phát sinh hoặc định kỳ báo cáo tài chính hàng tháng.
- **Kết quả đầu ra**: Báo cáo Dòng tiền (Cashflow) và Báo cáo Lãi Lỗ (Profit & Loss) được kết xuất tự động với số liệu minh bạch, chuẩn xác.

| Bước thực hiện | Chi tiết diễn tiến & Phản hồi của Hệ thống BanquetHub |
| :--- | :--- |
| **Bước 1: Thu thập giao dịch ngân hàng** | Webhook từ cổng SePay tự động bắn dữ liệu giao dịch về hệ thống BanquetHub ngay khi khách chuyển khoản thành công. |
| **Bước 2: Đối soát giao dịch tự động** | Hệ thống tự động đối chiếu mã đơn hàng và số tiền khớp 100% để chuyển trạng thái giao dịch thành Đã khớp tự động. |
| **Bước 3: Tổng hợp Doanh thu thuần** | Hệ thống tự động trích xuất tổng doanh thu thực nhận từ các đơn tiệc đã phục vụ hoàn tất (sau khi trừ chiết khấu voucher). |
| **Bước 4: Bóc tách Chi phí & Giá vốn** | Hệ thống tổng hợp chi phí giá vốn nguyên liệu thực xuất (COGS) theo giá bình quân gia quyền, cộng với tổng quỹ lương nhân viên đã duyệt trong kỳ. |
| **Bước 5: Kết xuất Báo cáo Lãi Lỗ (P&L)** | Hệ thống tính toán Lợi nhuận gộp, Chi phí vận hành và Lợi nhuận ròng (Net Profit), trực quan hóa bằng biểu đồ cột/tròn và bảng dữ liệu chi tiết theo từng tháng. |
| **Xử lý ngoại lệ / Lưu ý** | *Trường hợp khách chuyển tiền muộn khi đơn đã hết hạn 15 phút, kế toán có thể kiểm tra kho và bấm Kích hoạt đơn thủ công để bảo vệ quyền lợi khách hàng.* |

---

## PHẦN III: MA TRẬN TỔNG HỢP 22 USE CASE HỆ THỐNG BANQUETHUB

| Mã UC | Tên Use Case | Tác nhân chính | Phân hệ phụ trách |
| :---: | :--- | :--- | :--- |
| **UC-01** | Đăng ký tài khoản và xác thực mã otp qua email | Khách hàng mới | Phân hệ Khách hàng |
| **UC-02** | Đăng nhập hệ thống và phân quyền phiên làm việc | Khách hàng, Nhân viên bếp, Quản trị viên | Phân hệ Khách hàng & Phân quyền |
| **UC-03** | Khám phá món tiệc và tra cứu định mức dinh dưỡng | Khách hàng | Phân hệ Khách hàng |
| **UC-04** | Tự phối thực đơn bàn tiệc và kiểm tra tồn kho tự động | Khách hàng | Phân hệ Khách hàng |
| **UC-05** | Nhận tư vấn thực đơn tiệc từ trợ lý ai và chatbot | Khách hàng | Phân hệ Khách hàng |
| **UC-06** | Định vị địa chỉ tổ chức tiệc trên bản đồ số mapbox | Khách hàng | Phân hệ Khách hàng |
| **UC-07** | Áp dụng mã ưu đãi / voucher giảm giá vào đơn tiệc | Khách hàng | Phân hệ Khách hàng |
| **UC-08** | Xác nhận đặt tiệc và kích hoạt lệnh giữ chỗ kho 15 phút | Khách hàng | Phân hệ Khách hàng |
| **UC-09** | Thanh toán trực tuyến 100% qua napas 24/7 qr sepay | Khách hàng | Phân hệ Khách hàng & Thanh toán |
| **UC-10** | Tự động hoàn trả kho khi đơn tiệc hết hạn thanh toán | Hệ thống tự động | Hệ thống Tự động |
| **UC-11** | Theo dõi tiến độ chuẩn bị tiệc và in hợp đồng biên lai | Khách hàng | Phân hệ Khách hàng |
| **UC-12** | Tiếp nhận đơn tiệc đã thanh toán và bóc tách nguyên liệu nấu | Nhân viên Bếp, Điều phối viên | Phân hệ Nhân viên & Bếp |
| **UC-13** | Cập nhật tiến độ nấu tiệc và hoàn thành bàn giao sự kiện | Nhân viên Bếp, Điều phối viên, Quản trị viên | Phân hệ Nhân viên & Bếp |
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
| **Mô tả tóm tắt (Description)** | Cho phép người dùng mới tạo tài khoản cá nhân trên hệ thống BanquetHub và xác thực quyền sở hữu email chính chủ bằng mã OTP bảo mật. |
| **Tiền điều kiện (Preconditions)** | Người dùng có kết nối mạng internet và sở hữu một hộp thư điện tử cá nhân hợp lệ. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng truy cập trang web và bấm nút Đăng ký trên thanh điều hướng.<br>• <b>Bước 2</b>: Khách hàng điền đầy đủ thông tin: Họ và tên, Số điện thoại, Địa chỉ Email và Mật khẩu bảo mật.<br>• <b>Bước 3</b>: Khách hàng bấm nút Đăng ký tài khoản. Hệ thống kiểm tra dữ liệu, mã hóa mật khẩu và gửi email chứa mã OTP 6 chữ số có hiệu lực trong 5 phút.<br>• <b>Bước 4</b>: Giao diện chuyển sang màn hình nhập mã OTP kèm đồng hồ đếm ngược thời gian hiệu lực.<br>• <b>Bước 5</b>: Khách hàng mở hòm thư email, lấy mã xác thực OTP và nhập vào ô xác nhận rồi bấm Xác minh.<br>• <b>Bước 6</b>: Hệ thống kiểm tra mã OTP: nếu chính xác và còn trong thời hạn 5 phút, tài khoản được kích hoạt thành công và tự động chuyển hướng sang trang Đăng nhập. |
| **Hậu điều kiện (Postconditions)** | Tài khoản người dùng được lưu trữ an toàn trong cơ sở dữ liệu với trạng thái Đã kích hoạt. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Nếu nhập sai mã quá 5 lần hoặc quá thời hạn 5 phút, mã OTP cũ sẽ bị hủy và người dùng phải bấm nút Gửi lại mã OTP mới.* |

---

#### UC-02: ĐĂNG NHẬP HỆ THỐNG VÀ PHÂN QUYỀN PHIÊN LÀM VIỆC

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-02: ĐĂNG NHẬP HỆ THỐNG VÀ PHÂN QUYỀN PHIÊN LÀM VIỆC** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng & Phân quyền |
| **Tác nhân chính (Primary Actor)** | Khách hàng, Nhân viên bếp, Quản trị viên |
| **Mô tả tóm tắt (Description)** | Xác thực danh tính người dùng qua Email/Mật khẩu và cấp phát phiên đăng nhập an toàn theo đúng vai trò được phân quyền. |
| **Tiền điều kiện (Preconditions)** | Tài khoản người dùng đã được đăng ký và kích hoạt hợp lệ trong hệ thống. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Người dùng truy cập vào trang Đăng nhập.<br>• <b>Bước 2</b>: Người dùng nhập Email và Mật khẩu cá nhân, sau đó bấm nút Đăng nhập.<br>• <b>Bước 3</b>: Hệ thống kiểm tra mật khẩu mã hóa, đối soát trạng thái tài khoản đang hoạt động.<br>• <b>Bước 4</b>: Hệ thống khởi tạo mã thông thực phiên làm việc an toàn và lưu trên trình duyệt của người dùng.<br>• <b>Bước 5</b>: Hệ thống điều hướng tự động dựa trên vai trò: Khách hàng về Trang chủ/Đặt tiệc, Nhân viên về Bảng điều khiển Bếp, Quản trị viên về Trang Quản trị trung tâm. |
| **Hậu điều kiện (Postconditions)** | Người dùng đăng nhập thành công, phiên làm việc được duy trì và menu chức năng hiển thị đúng quyền hạn. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Hệ thống tự động khóa tạm thời 15 phút nếu người dùng đăng nhập sai mật khẩu liên tiếp quá 5 lần nhằm ngăn chặn tấn công dò mật khẩu.* |

---

#### UC-03: KHÁM PHÁ MÓN TIỆC VÀ TRA CỨU ĐỊNH MỨC DINH DƯỠNG

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-03: KHÁM PHÁ MÓN TIỆC VÀ TRA CỨU ĐỊNH MỨC DINH DƯỠNG** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer) |
| **Mô tả tóm tắt (Description)** | Cho phép khách hàng duyệt xem danh mục món tiệc đa dạng của nhà hàng kèm hình ảnh chất lượng cao, đơn giá niêm yết và chi tiết thành phần món ăn. |
| **Tiền điều kiện (Preconditions)** | Khách hàng truy cập trang web BanquetHub. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng bấm vào mục Món tiệc trên menu chính của website.<br>• <b>Bước 2</b>: Hệ thống hiển thị danh mục món ăn phân theo từng nhóm: Khai vị, Món chính, Lẩu & Canh, Tráng miệng, Đồ uống.<br>• <b>Bước 3</b>: Khách hàng sử dụng ô tìm kiếm theo tên món hoặc chọn bộ lọc phân loại để thu hẹp kết quả.<br>• <b>Bước 4</b>: Khách hàng bấm vào món ăn bất kỳ để xem trang chi tiết: hình ảnh phóng to, đơn giá niêm yết cho 01 bàn chuẩn (10 khách), mô tả hương vị và các nguyên liệu cấu thành món ăn. |
| **Hậu điều kiện (Postconditions)** | Khách hàng nắm rõ thông tin món ăn và có thể đưa món vào giỏ tự phối thực đơn tiệc. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Chỉ những món ăn đang ở trạng thái Hoạt động và có đầy đủ công thức định mức nguyên liệu mới được hiển thị công khai cho khách xem.* |

---

#### UC-04: TỰ PHỐI THỰC ĐƠN BÀN TIỆC VÀ KIỂM TRA TỒN KHO TỰ ĐỘNG

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-04: TỰ PHỐI THỰC ĐƠN BÀN TIỆC VÀ KIỂM TRA TỒN KHO TỰ ĐỘNG** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer) |
| **Mô tả tóm tắt (Description)** | Công cụ độc quyền cho phép khách hàng tự thiết kế set menu tiệc theo ý thích. Hệ thống tự động bóc tách định mức nguyên liệu và đối soát tồn kho tức thì. |
| **Tiền điều kiện (Preconditions)** | Khách hàng truy cập trang Tự phối thực đơn (Menu Builder). |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng nhập số lượng bàn tiệc dự kiến (mặc định 6 bàn, khách có thể tùy chỉnh tăng giảm từ 1 bàn trở lên).<br>• <b>Bước 2</b>: Khách hàng duyệt danh mục món và chọn các món ăn ưng ý cho bàn tiệc của mình.<br>• <b>Bước 3</b>: Ngay khi món được chọn, hệ thống tự động bóc tách khối lượng nguyên liệu (BOM) cần dùng cho toàn bộ số bàn và kiểm tra với số tồn sẵn có trong kho hàng.<br>• <b>Bước 4</b>: Hệ thống hiển thị đồng thời: Bảng các món đã chọn, đơn giá cho 01 bàn, tổng tiền tạm tính toàn tiệc, và thông báo kho nguyên liệu đầy đủ sẵn sàng phục vụ.<br>• <b>Bước 5</b>: Khách hàng bấm nút Tiếp tục đặt tiệc để chuyển toàn bộ cấu hình thực đơn sang trang Xác nhận đặt tiệc. |
| **Hậu điều kiện (Postconditions)** | Thực đơn tiệc độc bản của khách hàng được tạo thành công và sẵn sàng để đặt lịch tổ chức. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Nếu có nguyên liệu trong món bị hết hoặc không đủ phục vụ cho số bàn tiệc, hệ thống lập tức thông báo tên món thiếu hàng và tạm khóa nút tiếp tục để khách đổi món khác.* |

---

#### UC-05: NHẬN TƯ VẤN THỰC ĐƠN TIỆC TỪ TRỢ LÝ AI VÀ CHATBOT

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-05: NHẬN TƯ VẤN THỰC ĐƠN TIỆC TỪ TRỢ LÝ AI VÀ CHATBOT** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer) |
| **Mô tả tóm tắt (Description)** | Hỗ trợ khách hàng nhận tư vấn set menu tiệc tối ưu theo ngân sách và khẩu vị từ Trí tuệ nhân tạo Gemini, hoặc giải đáp các chính sách dịch vụ qua Chatbot. |
| **Tiền điều kiện (Preconditions)** | Khách hàng mở trang Gợi ý AI hoặc bấm vào biểu tượng Chatbot ở góc phải màn hình. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng nhập nhu cầu bằng ngôn ngữ tự nhiên (ví dụ: 'Gợi ý giúp tôi thực đơn cưới 10 bàn, ngân sách 2.5 triệu/bàn, phong cách thanh ngọt').<br>• <b>Bước 2</b>: Khách hàng bấm nút Nhờ AI tư vấn.<br>• <b>Bước 3</b>: Hệ thống gửi câu hỏi kèm dữ liệu tồn kho và danh mục món ăn thực tế tới mô hình Google Gemini để xử lý.<br>• <b>Bước 4</b>: Trợ lý AI phản hồi một set thực đơn trọn gói: tên set tiệc hấp dẫn, danh sách món hài hòa dinh dưỡng, tổng chi phí dự kiến và lời khuyên ẩm thực chuyên nghiệp.<br>• <b>Bước 5</b>: Khách hàng có thể bấm nút Áp dụng thực đơn này để đưa toàn bộ các món do AI tư vấn vào giỏ đặt tiệc. |
| **Hậu điều kiện (Postconditions)** | Khách hàng nhanh chóng có được thực đơn chuẩn chuyên gia mà không mất nhiều thời gian chọn từng món. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Khi khách hỏi về chính sách hủy tiệc hoặc hoàn tiền, Chatbot tuân thủ đúng quy định: thông báo rõ nhà hàng không hoàn tiền tự động, việc hủy/dời tiệc căn cứ theo điều khoản hợp đồng giữa hai bên.* |

---

#### UC-06: ĐỊNH VỊ ĐỊA CHỈ TỔ CHỨC TIỆC TRÊN BẢN ĐỒ SỐ MAPBOX

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-06: ĐỊNH VỊ ĐỊA CHỈ TỔ CHỨC TIỆC TRÊN BẢN ĐỒ SỐ MAPBOX** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer) |
| **Mô tả tóm tắt (Description)** | Giúp khách hàng tìm kiếm địa điểm và ghim vị trí tổ chức tiệc chuẩn xác trên bản đồ số tương tác Mapbox. |
| **Tiền điều kiện (Preconditions)** | Khách hàng đang ở màn hình Xác nhận đặt tiệc. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng di chuyển đến mục Thông tin địa điểm tổ chức tiệc.<br>• <b>Bước 2</b>: Khách hàng nhập địa chỉ (số nhà, tên đường, tên tòa nhà hoặc trung tâm sự kiện) vào ô tìm kiếm.<br>• <b>Bước 3</b>: Hệ thống hiển thị danh sách các địa chỉ gợi ý chuẩn xác tại Việt Nam qua kết nối Mapbox API.<br>• <b>Bước 4</b>: Khách hàng bấm chọn địa chỉ chính xác nhất trong danh sách gợi ý.<br>• <b>Bước 5</b>: Bản đồ tự động hiển thị ghim vị trí tương ứng và hệ thống lưu lại tọa độ kinh độ/vĩ độ để phục vụ vận chuyển và điều phối nhân sự sau này. |
| **Hậu điều kiện (Postconditions)** | Địa điểm tổ chức tiệc kèm tọa độ định vị được gắn liền với đơn tiệc. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Khách hàng có thể kéo thả nhẹ ghim trên bản đồ để tinh chỉnh vị trí đón tiếp khách chính xác nhất.* |

---

#### UC-07: ÁP DỤNG MÃ ƯU ĐÃI / VOUCHER GIẢM GIÁ VÀO ĐƠN TIỆC

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-07: ÁP DỤNG MÃ ƯU ĐÃI / VOUCHER GIẢM GIÁ VÀO ĐƠN TIỆC** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer) |
| **Mô tả tóm tắt (Description)** | Cho phép khách hàng tự nhập mã voucher khuyến mại để được giảm trừ tiền trực tiếp vào tổng hóa đơn thanh toán tiệc. |
| **Tiền điều kiện (Preconditions)** | Khách hàng đang ở bước thanh toán và có mã ưu đãi hợp lệ do nhà hàng phát hành. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Tại màn hình đặt tiệc, khách hàng tìm đến mục Mã ưu đãi / Voucher.<br>• <b>Bước 2</b>: Khách hàng tự tay gõ mã khuyến mại (ví dụ: TIECXUAN2026) vào ô nhập mã.<br>• <b>Bước 3</b>: Khách hàng bấm nút Áp dụng.<br>• <b>Bước 4</b>: Hệ thống kiểm tra điều kiện mã: thời hạn hiệu lực, giá trị đơn tiệc hiện tại có đạt mức tối thiểu, và tài khoản của khách chưa dùng quá số lượt cho phép.<br>• <b>Bước 5</b>: Nếu hợp lệ, hệ thống tính toán số tiền được giảm (giảm tiền mặt hoặc giảm theo %) và hiển thị dòng giảm giá màu xanh nổi bật.<br>• <b>Bước 6</b>: Tổng số tiền cần thanh toán của đơn tiệc được tự động giảm trừ ngay lập tức. |
| **Hậu điều kiện (Postconditions)** | Đơn tiệc được ghi nhận mức giảm giá voucher và giảm bớt số tiền cần thanh toán. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Hệ thống không cung cấp danh sách mã có sẵn để khách chọn mà bắt buộc khách phải tự nhập mã thủ công, bảo đảm tính độc quyền của các chiến dịch ưu đãi.* |

---

#### UC-08: XÁC NHẬN ĐẶT TIỆC VÀ KÍCH HOẠT LỆNH GIỮ CHỖ KHO 15 PHÚT

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-08: XÁC NHẬN ĐẶT TIỆC VÀ KÍCH HOẠT LỆNH GIỮ CHỖ KHO 15 PHÚT** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer) |
| **Mô tả tóm tắt (Description)** | Chốt thông tin đặt tiệc và kích hoạt cơ chế khóa giữ nguyên liệu trong 15 phút, bảo đảm không bị người khác mua mất trong lúc khách chuẩn bị thanh toán. |
| **Tiền điều kiện (Preconditions)** | Khách hàng đã hoàn tất việc chọn món, ngày giờ, địa điểm và kiểm tra tổng tiền. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng rà soát lại thông tin sự kiện: người đại diện, số điện thoại, ngày giờ, địa điểm, số bàn và tổng thanh toán.<br>• <b>Bước 2</b>: Khách hàng bấm nút Xác nhận đặt tiệc.<br>• <b>Bước 3</b>: Hệ thống kiểm tra tồn kho lần cuối, tạo đơn tiệc mới với trạng thái Chờ thanh toán.<br>• <b>Bước 4</b>: Hệ thống kích hoạt Lệnh giữ chỗ nguyên liệu kho (Hold Stock) trong thời hạn đúng 15 phút, khóa lượng nguyên liệu định mức lại.<br>• <b>Bước 5</b>: Màn hình chuyển sang trang Xác nhận đơn hàng thành công, hiển thị đồng hồ đếm ngược 15:00 và nút dẫn sang cổng thanh toán. |
| **Hậu điều kiện (Postconditions)** | Đơn tiệc được tạo, kho nguyên liệu được giữ chỗ an toàn và đồng hồ đếm ngược bắt đầu chạy. |
| **Quy tắc nghiệp vụ & Lưu ý** | *BanquetHub áp dụng cơ chế thanh toán 100% để đảm bảo nguyên liệu tươi sống cho bữa tiệc, không áp dụng hình thức đặt cọc 50%.* |

---

#### UC-09: THANH TOÁN TRỰC TUYẾN 100% QUA NAPAS 24/7 QR SEPAY

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-09: THANH TOÁN TRỰC TUYẾN 100% QUA NAPAS 24/7 QR SEPAY** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng & Thanh toán |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer), Cổng SePay |
| **Mô tả tóm tắt (Description)** | Khách hàng quét mã QR động bằng ứng dụng ngân hàng để thanh toán 100% đơn tiệc; hệ thống tự nhận tiền và kích hoạt đơn tức thì. |
| **Tiền điều kiện (Preconditions)** | Đơn tiệc đang ở trạng thái Chờ thanh toán và còn trong thời hạn giữ chỗ 15 phút. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng bấm nút Thanh toán ngay qua SePay trên giao diện đơn hàng.<br>• <b>Bước 2</b>: Màn hình thanh toán hiển thị mã QR Napas 24/7 có sẵn số tiền thanh toán 100% và nội dung chuyển khoản định danh riêng cho đơn hàng.<br>• <b>Bước 3</b>: Khách hàng mở ứng dụng ngân hàng (Mobile Banking) trên điện thoại, quét mã QR và xác nhận chuyển khoản.<br>• <b>Bước 4</b>: Ngay khi ngân hàng ghi nhận tiền vào tài khoản nhà hàng, cổng SePay tự động bắn Webhook về BanquetHub.<br>• <b>Bước 5</b>: BanquetHub kiểm tra số tiền khớp đúng 100%, tự động chuyển đơn sang Đã thanh toán, khóa vĩnh viễn nguyên liệu và tắt đồng hồ đếm ngược.<br>• <b>Bước 6</b>: Màn hình của khách hàng tự động chuyển sang thông báo Đã thanh toán thành công và gửi biên lai xác nhận qua email. |
| **Hậu điều kiện (Postconditions)** | Đơn tiệc chính thức bước vào quy trình phục vụ của nhà hàng. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Giao dịch xử lý tự động hoàn toàn 24/7 không cần nhân viên kế toán can thiệp hay chờ duyệt thủ công.* |

---

#### UC-10: TỰ ĐỘNG HOÀN TRẢ KHO KHI ĐƠN TIỆC HẾT HẠN THANH TOÁN

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-10: TỰ ĐỘNG HOÀN TRẢ KHO KHI ĐƠN TIỆC HẾT HẠN THANH TOÁN** |
| **Phân hệ phụ trách** | Hệ thống Tự động (Scheduled Worker) |
| **Tác nhân chính (Primary Actor)** | Hệ thống tự động (Scheduled Worker) |
| **Mô tả tóm tắt (Description)** | Tự động giải phóng nguyên liệu bị khóa nếu khách hàng không thanh toán trong vòng 15 phút, tránh tình trạng giam giữ kho ảo gây thiệt hại cho nhà hàng. |
| **Tiền điều kiện (Preconditions)** | Đơn tiệc ở trạng thái Chờ thanh toán nhưng đã quá thời hạn giữ chỗ 15 phút. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Tác vụ tự động quét ngầm chạy định kỳ mỗi phút trên máy chủ hệ thống.<br>• <b>Bước 2</b>: Hệ thống phát hiện các đơn hàng Chờ thanh toán đã hết hạn 15 phút.<br>• <b>Bước 3</b>: Hệ thống chuyển trạng thái đơn hàng thành Hết hạn giữ chỗ.<br>• <b>Bước 4</b>: Lệnh giữ chỗ kho tương ứng bị hủy, toàn bộ số lượng nguyên liệu định mức được hoàn trả lại ngay lập tức vào tồn kho sẵn có.<br>• <b>Bước 5</b>: Giao diện khách hàng cập nhật đồng hồ về 00:00, ẩn nút thanh toán và hiển thị nút Tái tạo đơn tiệc để hỗ trợ khách đặt lại nếu vẫn có nhu cầu. |
| **Hậu điều kiện (Postconditions)** | Tồn kho nguyên liệu được giải phóng an toàn cho các khách hàng khác tiếp tục đặt. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Cơ chế này giúp loại bỏ 100% nguy cơ khách đặt ảo làm tê liệt nguồn cung nguyên liệu của nhà hàng.* |

---

#### UC-11: THEO DÕI TIẾN ĐỘ CHUẨN BỊ TIỆC VÀ IN HỢP ĐỒNG BIÊN LAI

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-11: THEO DÕI TIẾN ĐỘ CHUẨN BỊ TIỆC VÀ IN HỢP ĐỒNG BIÊN LAI** |
| **Phân hệ phụ trách** | Phân hệ Khách hàng (Customer Portal) |
| **Tác nhân chính (Primary Actor)** | Khách hàng (Customer) |
| **Mô tả tóm tắt (Description)** | Giúp khách hàng theo dõi từng bước phục vụ tiệc của nhà hàng và in hợp đồng dịch vụ tiệc hoặc biên lai thu tiền điện tử. |
| **Tiền điều kiện (Preconditions)** | Khách hàng đã có tài khoản và đã từng thực hiện đặt tiệc trên hệ thống. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Khách hàng vào mục Đơn tiệc của tôi trên thanh menu.<br>• <b>Bước 2</b>: Hệ thống hiển thị danh sách toàn bộ các tiệc đã đặt kèm bộ lọc theo trạng thái: Chờ thanh toán, Đã thanh toán, Đang chuẩn bị, Hoàn thành, Đã hủy.<br>• <b>Bước 3</b>: Khách hàng bấm Xem chi tiết vào một đơn tiệc cụ thể.<br>• <b>Bước 4</b>: Hệ thống hiển thị thanh tiến trình trực quan theo thời gian thực (Đã nhận đơn -> Bếp đang nấu -> Đang phục vụ tiệc -> Hoàn thành tiệc).<br>• <b>Bước 5</b>: Khách hàng xem lại danh sách món, số tiền giảm giá voucher, tổng thanh toán và có thể bấm nút In hợp đồng tiệc để lưu file PDF hoặc in giấy. |
| **Hậu điều kiện (Postconditions)** | Khách hàng an tâm theo dõi sự kiện của mình và có đủ chứng từ pháp lý dịch vụ tiệc. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Bản in hợp đồng tiệc được định dạng chuẩn quy chuẩn doanh nghiệp có đầy đủ điều khoản pháp lý và thông tin sự kiện.* |

---

### ■ PHÂN HỆ NHÂN VIÊN & BẾP (EMPLOYEE PORTAL)

#### UC-12: TIẾP NHẬN ĐƠN TIỆC ĐÃ THANH TOÁN VÀ BÓC TÁCH NGUYÊN LIỆU NẤU

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-12: TIẾP NHẬN ĐƠN TIỆC ĐÃ THANH TOÁN VÀ BÓC TÁCH NGUYÊN LIỆU NẤU** |
| **Phân hệ phụ trách** | Phân hệ Nhân viên & Bếp (Employee Portal) |
| **Tác nhân chính (Primary Actor)** | Nhân viên Bếp, Điều phối viên (Employee) |
| **Mô tả tóm tắt (Description)** | Đội ngũ bếp theo dõi lịch phục vụ tiệc đã thanh toán thành công để chuẩn bị nguyên liệu và triển khai quy trình nấu nướng. |
| **Tiền điều kiện (Preconditions)** | Nhân viên đăng nhập tài khoản nhân viên được cấp và đơn tiệc đã thanh toán hợp lệ. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Nhân viên mở mục Quản lý đơn tiệc bếp tại phân hệ nhân viên.<br>• <b>Bước 2</b>: Hệ thống hiển thị danh sách các đơn tiệc Đã thanh toán sắp tới ngày tổ chức.<br>• <b>Bước 3</b>: Nhân viên bấm vào đơn tiệc để xem bảng bóc tách: số lượng bàn, từng món cần nấu và khối lượng chi tiết từng nguyên liệu cần lấy từ kho.<br>• <b>Bước 4</b>: Nhân viên bấm nút Bắt đầu chế biến tiệc.<br>• <b>Bước 5</b>: Hệ thống chuyển trạng thái đơn hàng sang Đang chuẩn bị tiệc (IN_PROGRESS) và ghi nhận việc xuất kho nguyên liệu thực tế cho ca nấu. |
| **Hậu điều kiện (Postconditions)** | Đơn tiệc chính thức được đưa vào quy trình nấu nướng tại bếp. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Bảng bóc tách nguyên liệu tự động nhân chuẩn xác định mức món với số bàn, giúp đầu bếp không phải tính toán thủ công.* |

---

#### UC-13: CẬP NHẬT TIẾN ĐỘ NẤU TIỆC VÀ HOÀN THÀNH BÀN GIAO SỰ KIỆN

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-13: CẬP NHẬT TIẾN ĐỘ NẤU TIỆC VÀ HOÀN THÀNH BÀN GIAO SỰ KIỆN** |
| **Phân hệ phụ trách** | Phân hệ Nhân viên & Bếp (Employee Portal) |
| **Tác nhân chính (Primary Actor)** | Nhân viên Bếp, Điều phối viên, Quản trị viên |
| **Mô tả tóm tắt (Description)** | Xác nhận kết thúc buổi tiệc sau khi phục vụ hoàn tất tại địa điểm khách hàng, đưa số liệu vào hạch toán tài chính. |
| **Tiền điều kiện (Preconditions)** | Đơn tiệc đang ở trạng thái Đang chuẩn bị và sự kiện đã được phục vụ xong. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Sau khi buổi tiệc kết thúc và khách hàng ký biên bản nghiệm thu dịch vụ, nhân viên mở lại chi tiết đơn tiệc.<br>• <b>Bước 2</b>: Nhân viên bấm nút Xác nhận hoàn thành tiệc.<br>• <b>Bước 3</b>: Hệ thống ghi nhận thời điểm hoàn tất, chuyển trạng thái đơn tiệc sang Hoàn thành (COMPLETED).<br>• <b>Bước 4</b>: Hệ thống tự động đưa số liệu doanh thu và chi phí giá vốn của bữa tiệc vào sổ kế toán để tính lợi nhuận. |
| **Hậu điều kiện (Postconditions)** | Đơn tiệc đóng chu trình thành công, khách hàng có thể chấm điểm đánh giá chất lượng dịch vụ. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Khi đơn chuyển trạng thái Hoàn thành, hệ thống sẽ mở khóa cho khách hàng gửi đánh giá nhận xét chất lượng món ăn.* |

---

#### UC-14: NHÂN VIÊN THỰC HIỆN CHẤM CÔNG CA LÀM VIỆC HÀNG NGÀY

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-14: NHÂN VIÊN THỰC HIỆN CHẤM CÔNG CA LÀM VIỆC HÀNG NGÀY** |
| **Phân hệ phụ trách** | Phân hệ Nhân viên (Employee Portal) |
| **Tác nhân chính (Primary Actor)** | Nhân viên nhà hàng (Employee) |
| **Mô tả tóm tắt (Description)** | Ghi nhận ngày làm việc thực tế của nhân viên làm căn cứ tính bảng lương tự động vào cuối tháng. |
| **Tiền điều kiện (Preconditions)** | Nhân viên đã đến nhà hàng hoặc địa điểm tổ chức tiệc. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Nhân viên đăng nhập và truy cập trang Chấm công cá nhân.<br>• <b>Bước 2</b>: Nhân viên bấm nút Chấm công vào ca khi bắt đầu làm việc.<br>• <b>Bước 3</b>: Hệ thống ghi nhận thời gian vào ca thực tế.<br>• <b>Bước 4</b>: Khi kết thúc ca làm việc, nhân viên bấm Chấm công tan ca.<br>• <b>Bước 5</b>: Hệ thống lưu lại bản ghi ngày công (Đủ ca, Nửa ca) vào cơ sở dữ liệu để phục vụ kỳ tính lương. |
| **Hậu điều kiện (Postconditions)** | Dữ liệu chấm công trong ngày của nhân viên được lưu lại minh bạch. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Hệ thống tự động đối chiếu thời gian chấm công với ca làm việc để phân loại đi làm đúng giờ hay đi muộn/về sớm.* |

---

#### UC-15: NHÂN VIÊN TRA CỨU PHIẾU LƯƠNG CÁ NHÂN HÀNG THÁNG

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-15: NHÂN VIÊN TRA CỨU PHIẾU LƯƠNG CÁ NHÂN HÀNG THÁNG** |
| **Phân hệ phụ trách** | Phân hệ Nhân viên (Employee Portal) |
| **Tác nhân chính (Primary Actor)** | Nhân viên nhà hàng (Employee) |
| **Mô tả tóm tắt (Description)** | Giúp nhân viên minh bạch theo dõi chi tiết số ngày công, các khoản phụ cấp, thưởng phạt và mức lương thực nhận mỗi tháng. |
| **Tiền điều kiện (Preconditions)** | Ban giám đốc đã phê duyệt bảng lương của tháng tương ứng. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Nhân viên truy cập mục Phiếu lương của tôi.<br>• <b>Bước 2</b>: Hệ thống hiển thị danh sách các kỳ lương hàng tháng đã được phê duyệt.<br>• <b>Bước 3</b>: Nhân viên bấm xem chi tiết kỳ lương mong muốn: hệ thống hiển thị rõ ràng số ngày công thực tế, lương cơ bản, phụ cấp trách nhiệm, thưởng sự kiện, các khoản trừ và số tiền lương thực nhận chuyển khoản. |
| **Hậu điều kiện (Postconditions)** | Nhân viên nắm rõ thu nhập hàng tháng một cách rõ ràng, không tranh chấp. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Nhân viên có thể xuất phiếu lương ra dạng tài liệu để lưu trữ cá nhân.* |

---

### ■ PHÂN HỆ QUẢN TRỊ TRUNG TÂM (ADMIN PORTAL)

#### UC-16: QUẢN LÝ DANH MỤC MÓN ĂN VÀ ĐỊNH MỨC NGUYÊN LIỆU (BOM)

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-16: QUẢN LÝ DANH MỤC MÓN ĂN VÀ ĐỊNH MỨC NGUYÊN LIỆU (BOM)** |
| **Phân hệ phụ trách** | Phân hệ Quản trị (Admin Portal) |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin) |
| **Mô tả tóm tắt (Description)** | Cấu hình danh mục món ăn hiển thị trên website và thiết lập công thức chi tiết từng gam nguyên liệu cấu thành cho mỗi món. |
| **Tiền điều kiện (Preconditions)** | Quản trị viên đăng nhập bằng tài khoản Quản trị cấp cao. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Admin mở trang Quản lý Thực đơn & Món ăn tại phân hệ quản trị.<br>• <b>Bước 2</b>: Admin thêm món ăn mới: nhập tên món, phân nhóm món, tải ảnh món chất lượng cao, đặt đơn giá cho 01 bàn tiệc.<br>• <b>Bước 3</b>: Admin thiết lập công thức định mức (BOM): chọn các nguyên liệu từ danh mục kho và nhập định lượng chuẩn xác (ví dụ: Món Bò né cần 0.8kg thịt bò, 0.1kg bơ, 0.2kg hành tây).<br>• <b>Bước 4</b>: Hệ thống tự động tính giá vốn lý thuyết của món dựa trên giá vốn bình quân hiện tại của các nguyên liệu.<br>• <b>Bước 5</b>: Admin bấm Lưu món ăn. Món ăn mới xuất hiện công khai trên website cho khách hàng chọn đặt. |
| **Hậu điều kiện (Postconditions)** | Món ăn và công thức định mức được lưu trữ, làm nền tảng cho việc kiểm tra tồn kho tự động. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Hệ thống ngăn chặn việc mở bán món ăn nếu món đó chưa được khai báo ít nhất một nguyên liệu trong công thức định mức.* |

---

#### UC-17: LẬP PHIẾU NHẬP KHO NGUYÊN LIỆU VÀ TÍNH GIÁ VỐN BÌNH QUÂN GIA QUYỀN

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-17: LẬP PHIẾU NHẬP KHO NGUYÊN LIỆU VÀ TÍNH GIÁ VỐN BÌNH QUÂN GIA QUYỀN** |
| **Phân hệ phụ trách** | Phân hệ Quản trị (Admin Portal) |
| **Tác nhân chính (Primary Actor)** | Quản trị viên, Thủ kho (Admin) |
| **Mô tả tóm tắt (Description)** | Nhập hàng hóa nguyên liệu từ nhà cung cấp vào kho, hệ thống tự động cộng dồn tồn kho và tính lại đơn giá vốn bình quân gia quyền. |
| **Tiền điều kiện (Preconditions)** | Hàng hóa nguyên liệu được nhà cung cấp vận chuyển tới cửa kho nhà hàng. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Admin mở trang Nhập hàng và bấm Tạo phiếu nhập mới.<br>• <b>Bước 2</b>: Admin chọn Nhà cung cấp thực phẩm từ danh sách đối tác.<br>• <b>Bước 3</b>: Admin thêm từng dòng nguyên liệu: chọn tên mặt hàng, số lượng nhập theo đơn vị chuẩn và đơn giá nhập thực tế.<br>• <b>Bước 4</b>: Hệ thống tự động tính tổng tiền phiếu nhập và hiển thị số tiền cần thanh toán.<br>• <b>Bước 5</b>: Admin nhập số tiền đã thanh toán cho nhà cung cấp và bấm Xác nhận nhập kho.<br>• <b>Bước 6</b>: Hệ thống tự động cộng số lượng vào tồn kho thực tế, áp dụng công thức Bình quân gia quyền để tính lại đơn giá vốn bình quân mới cho từng nguyên liệu, ghi nhật ký Sổ biến động kho và lưu công nợ. |
| **Hậu điều kiện (Postconditions)** | Tồn kho nguyên liệu tăng lên và giá vốn mới được áp dụng ngay lập tức cho các phép tính lợi nhuận tiệc. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Công thức bình quân gia quyền: Đơn giá mới = (Giá trị tồn cũ + Giá trị nhập mới) / (Số lượng tồn cũ + Số lượng nhập mới).* |

---

#### UC-18: GIÁM SÁT TỒN KHO KHẢ DỤNG VÀ CẢNH BÁO NGUYÊN LIỆU SẮP HẾT

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-18: GIÁM SÁT TỒN KHO KHẢ DỤNG VÀ CẢNH BÁO NGUYÊN LIỆU SẮP HẾT** |
| **Phân hệ phụ trách** | Phân hệ Quản trị (Admin Portal) |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin) |
| **Mô tả tóm tắt (Description)** | Theo dõi số lượng hàng hóa trong kho theo thời gian thực để kịp thời nhập thêm hàng, đảm bảo không bị gián đoạn hoạt động kinh doanh tiệc. |
| **Tiền điều kiện (Preconditions)** | Quản trị viên truy cập trang Tổng quan kho & Nguyên liệu. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Admin mở trang Tổng quan kho & Nguyên liệu tại menu bên trái.<br>• <b>Bước 2</b>: Hệ thống hiển thị danh mục toàn bộ nguyên liệu kèm 3 chỉ số cốt lõi: Tồn vật lý trong kho, Số lượng đang bị các đơn đặt tiệc khóa giữ chỗ, và Tồn khả dụng thực tế sẵn sàng nhận thêm tiệc mới.<br>• <b>Bước 3</b>: Các nguyên liệu có số tồn khả dụng thấp hơn mức an toàn tối thiểu được hệ thống tự động gắn nhãn cảnh báo đỏ Cần nhập thêm hàng.<br>• <b>Bước 4</b>: Admin có thể bấm vào từng nguyên liệu để xem chi tiết lịch sử nhập xuất tại Sổ biến động kho. |
| **Hậu điều kiện (Postconditions)** | Quản trị viên nắm bắt chính xác hiện trạng kho hàng và chủ động nhập hàng. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Tồn khả dụng = Tồn vật lý - Lượng giữ chỗ của các đơn chờ thanh toán & đang chuẩn bị.* |

---

#### UC-19: QUẢN LÝ CHIẾN DỊCH ƯU ĐÃI VÀ CẤU HÌNH HẠN MỨC VOUCHER

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-19: QUẢN LÝ CHIẾN DỊCH ƯU ĐÃI VÀ CẤU HÌNH HẠN MỨC VOUCHER** |
| **Phân hệ phụ trách** | Phân hệ Quản trị (Admin Portal) |
| **Tác nhân chính (Primary Actor)** | Quản trị viên (Admin) |
| **Mô tả tóm tắt (Description)** | Tạo mới và kiểm soát các chương trình khuyến mại, mã giảm giá để kích cầu đặt tiệc mà vẫn bảo đảm an toàn tài chính cho nhà hàng. |
| **Tiền điều kiện (Preconditions)** | Quản trị viên mở trang Quản lý Voucher. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Admin bấm vào mục Quản lý Voucher trên thanh điều hướng.<br>• <b>Bước 2</b>: Hệ thống hiển thị bảng thống kê tổng số voucher, voucher đang chạy và tổng lượt sử dụng của khách.<br>• <b>Bước 3</b>: Admin bấm nút Thêm voucher mới và nhập các tham số: Mã voucher, Tên chương trình, Hình thức giảm (tiền mặt/%), Giá trị giảm, Giới hạn giảm tối đa, Giá trị đơn tối thiểu, Tổng lượt dùng toàn sàn, Lượt tối đa/khách và Hạn dùng.<br>• <b>Bước 4</b>: Admin bấm Lưu voucher. Mã voucher mới lập tức đi vào hoạt động.<br>• <b>Bước 5</b>: Admin có thể bật/tắt nhanh trạng thái tạm dừng áp dụng của một voucher bất kỳ lúc nào ngay trên bảng danh sách mà không cần xóa mã. |
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
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Kế toán mở mục Thanh toán & Đối soát tại phân hệ quản trị.<br>• <b>Bước 2</b>: Hệ thống hiển thị danh sách toàn bộ các giao dịch chuyển khoản ngân hàng tự động kèm trạng thái đối soát: Đã khớp đơn tự động, Chờ đối soát, hoặc Chưa khớp.<br>• <b>Bước 3</b>: Kế toán kiểm tra mã tham chiếu ngân hàng, số tiền thực nhận và mã đơn tiệc tương ứng.<br>• <b>Bước 4</b>: Trường hợp khách hàng chuyển khoản muộn khi đơn đã quá hạn 15 phút nhưng kho vẫn đủ nguyên liệu phục vụ, kế toán bấm nút Xác nhận kích hoạt đơn thủ công để kích hoạt đơn cho khách.<br>• <b>Bước 5</b>: Hệ thống ghi nhận lịch sử duyệt của kế toán và chuyển đơn sang trạng thái Đã thanh toán an toàn. |
| **Hậu điều kiện (Postconditions)** | Dòng tiền vào tài khoản ngân hàng được đối soát 100% minh bạch. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Mọi thao tác kích hoạt đơn thủ công đều được lưu vết chi tiết người thực hiện để phục vụ kiểm toán nội bộ.* |

---

#### UC-21: QUẢN TRỊ HỒ SƠ NHÂN SỰ, DUYỆT CÔNG VÀ TỰ ĐỘNG TÍNH BẢNG LƯƠNG

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-21: QUẢN TRỊ HỒ SƠ NHÂN SỰ, DUYỆT CÔNG VÀ TỰ ĐỘNG TÍNH BẢNG LƯƠNG** |
| **Phân hệ phụ trách** | Phân hệ Quản trị & Nhân sự |
| **Tác nhân chính (Primary Actor)** | Quản trị viên, Trưởng phòng Nhân sự (Admin) |
| **Mô tả tóm tắt (Description)** | Quản lý nhân viên nhà hàng, phê duyệt dữ liệu chấm công và tự động tính toán bảng lương thực nhận mỗi tháng. |
| **Tiền điều kiện (Preconditions)** | Đến kỳ tổng kết công và tính lương cuối tháng của nhà hàng. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Admin mở trang Quản lý nhân viên để quản lý hồ sơ nhân sự: hợp đồng, chức vụ, mức lương cơ bản và tài khoản hệ thống.<br>• <b>Bước 2</b>: Cuối tháng, Admin mở trang Chấm công để rà soát và duyệt bảng công tổng hợp của toàn thể nhân viên.<br>• <b>Bước 3</b>: Admin chuyển sang mục Kỳ lương, tạo kỳ lương tháng mới và bấm nút Tính toán bảng lương tự động.<br>• <b>Bước 4</b>: Hệ thống tự động quét số ngày công thực tế của từng nhân viên, nhân với lương cơ bản, cộng phụ cấp và tiền thưởng sự kiện, trừ các khoản phạt/tạm ứng và xuất ra bảng lương hoàn chỉnh.<br>• <b>Bước 5</b>: Admin kiểm tra lại các con số, sau đó bấm Phê duyệt bảng lương để phát hành phiếu lương cho nhân viên và chuyển số liệu sang kế toán chi tiền. |
| **Hậu điều kiện (Postconditions)** | Bảng lương tháng được duyệt, phiếu lương cá nhân được phát hành và chi phí nhân sự được ghi nhận vào báo cáo tài chính. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Hệ thống cho phép cấu hình linh hoạt các mức phụ cấp chức vụ và tiền thưởng sự kiện tiệc cho từng nhân viên.* |

---

#### UC-22: BÁO CÁO TÀI CHÍNH DOANH THU, CHI PHÍ GIÁ VỐN VÀ LỢI NHUẬN (P&L)

| Thuộc tính đặc tả | Nội dung chi tiết |
| :--- | :--- |
| **Mã & Tên Use Case** | **UC-22: BÁO CÁO TÀI CHÍNH DOANH THU, CHI PHÍ GIÁ VỐN VÀ LỢI NHUẬN (P&L)** |
| **Phân hệ phụ trách** | Phân hệ Quản trị & Báo cáo |
| **Tác nhân chính (Primary Actor)** | Quản trị viên, Giám đốc điều hành (Admin) |
| **Mô tả tóm tắt (Description)** | Cung cấp bức tranh tài chính toàn diện giúp chủ nhà hàng nắm rõ doanh thu thuần, giá vốn hàng bán, chi phí nhân sự và lợi nhuận ròng của từng tháng. |
| **Tiền điều kiện (Preconditions)** | Quản trị viên truy cập trang Báo cáo lợi nhuận (P&L) hoặc Báo cáo dòng tiền. |
| **Luồng hoạt động chính (Main Flow)** | • <b>Bước 1</b>: Admin mở trang Báo cáo lợi nhuận (P&L) trên menu báo cáo.<br>• <b>Bước 2</b>: Admin lựa chọn khoảng thời gian cần phân tích (theo tháng, theo quý hoặc theo năm).<br>• <b>Bước 3</b>: Hệ thống tự động tổng hợp số liệu từ các phân hệ: Doanh thu thực tế từ các đơn tiệc đã phục vụ hoàn tất (sau khi trừ chiết khấu voucher), Chi phí giá vốn nguyên liệu xuất kho theo giá bình quân gia quyền, Chi phí lương nhân viên đã duyệt trong kỳ, và Chi phí vận hành khác.<br>• <b>Bước 4</b>: Hệ thống tính toán các chỉ số kinh doanh then chốt: Lợi nhuận gộp, Tỷ suất lợi nhuận gộp và Lợi nhuận thuần thực tế (Net Profit).<br>• <b>Bước 5</b>: Giao diện hiển thị biểu đồ trực quan (cơ cấu doanh thu chi phí, biểu đồ tăng trưởng qua các tháng) và bảng số liệu phân tích chi tiết để hỗ trợ việc ra quyết định kinh doanh. |
| **Hậu điều kiện (Postconditions)** | Ban giám đốc có được báo cáo tài chính chính xác, minh bạch để định hướng chiến lược kinh doanh. |
| **Quy tắc nghiệp vụ & Lưu ý** | *Báo cáo P&L được cập nhật tự động theo thời gian thực mỗi khi có đơn tiệc hoàn thành hoặc phiếu nhập hàng được xác nhận.* |

---

## PHẦN V: TỔNG KẾT VÀ NGUYÊN TẮC THIẾT KẾ HỆ THỐNG

| Nguyên tắc / Đột phá | Giá trị thực tiễn trong vận hành nhà hàng tiệc |
| :--- | :--- |
| **Tự động hóa thanh toán 100% Napas SePay** | Loại bỏ hoàn toàn quy trình duyệt bill chuyển khoản thủ công. Ngay khi khách chuyển tiền qua mã QR Napas 24/7, cổng SePay phát Webhook xác thực tức thì và đơn tiệc tự động chuyển trạng thái Đã thanh toán trong vòng vài giây. |
| **Cơ chế bảo vệ kho chống đặt giữ ảo (15 phút)** | Khi bấm Xác nhận đặt tiệc, kho nguyên liệu tự động khóa giữ trong đúng 15 phút. Nếu khách không thanh toán, tác vụ ngầm tự động hủy đơn và giải phóng 100% nguyên liệu về kho, chống tình trạng kho bị đóng băng. |
| **Bóc tách định mức BOM & Giá vốn bình quân** | Mỗi món ăn đều gắn liền với công thức định mức nguyên liệu (Bill of Materials). Khi nhập hàng, hệ thống tự động tính lại đơn giá vốn bình quân gia quyền, giúp xác định chuẩn xác 100% giá vốn của từng buổi tiệc. |
| **Quản trị tài chính và Báo cáo P&L khép kín** | Hệ thống tự động liên kết Doanh thu tiệc thực tế, Chi phí giá vốn xuất kho và Chi phí lương nhân sự đã duyệt để kết xuất Báo cáo Dòng tiền (Cashflow) và Báo cáo Lợi nhuận (P&L) theo từng tháng, hỗ trợ ra quyết định kinh doanh tối ưu. |