# DANH SÁCH USE CASE & MÔ TẢ CÁC LUỒNG HOẠT ĐỘNG CHÍNH
## HỆ THỐNG QUẢN TRỊ ẨM THỰC VÀ ĐẶT TIỆC BANQUETHUB

- **Dự án áp dụng**: BanquetHub - Nền tảng Đặt Tiệc Cưới & Quản Trị Vận Hành Ẩm Thực Tập Trung
- **Tài liệu dùng cho**: Báo cáo Đồ án Tốt nghiệp / Tài liệu Thiết kế & Đặc tả Hệ thống
- **Tác giả biên soạn**: Trần Văn Khiên (tranzankhien@gmail.com)
- **Hình thức trình bày**: Liệt kê tên Luồng chính, tên Use Case và mô tả chi tiết bằng văn xuôi tiếng Việt (Tuyệt đối không chèn mã code, không chèn cú pháp vẽ hình).
- **Ngày hoàn thiện**: 24/11/2026

---

## PHẦN I: TỔNG HỢP 6 LUỒNG NGHIỆP VỤ CHÍNH TOÀN HỆ THỐNG (CORE BUSINESS FLOWS)

Hệ thống BanquetHub vận hành xoay quanh 6 Luồng nghiệp vụ xương sống, liên kết chặt chẽ giữa Khách hàng, Bếp điều phối và Quản trị viên:

### 1. Luồng chính 1: Đặt tiệc và Thanh toán trực tuyến 100% (Order & Payment Flow)
- **Tên luồng**: Luồng Khách hàng Tự phối thực đơn -> Kiểm tra kho tự động -> Nhập mã giảm giá Voucher -> Định vị địa chỉ tổ chức trên bản đồ Mapbox -> Khóa giữ chỗ kho nguyên liệu 15 phút -> Quét mã Napas 24/7 QR SePay thanh toán 100% -> Kích hoạt đơn tiệc tức thì.
- **Tác nhân tham gia**: Khách hàng, Cổng thanh toán SePay, Hệ thống kiểm tra tồn kho tự động.
- **Mô tả diễn tiến luồng**:
  - Khách hàng khám phá các món ăn và sử dụng công cụ Tự phối thực đơn (Menu Builder) để tạo set menu theo số lượng bàn tiệc mong muốn.
  - Ngay khi chọn món, hệ thống tự động bóc tách định mức nguyên liệu (BOM) và kiểm tra đối soát với tồn kho thực tế. Nếu đủ nguyên liệu, hệ thống cho phép tiếp tục.
  - Khách hàng nhập mã Voucher giảm giá (nếu có); hệ thống thẩm định tính hợp lệ và trừ chiết khấu trực tiếp vào tổng tiền.
  - Khách hàng tìm kiếm địa điểm và ghim vị trí tổ chức tiệc trên bản đồ số Mapbox.
  - Khi bấm Xác nhận đặt tiệc, hệ thống tạo đơn tiệc mới và tự động kích hoạt Lệnh giữ chỗ nguyên liệu kho (Hold Stock) trong thời hạn 15 phút.
  - Khách hàng mở ứng dụng ngân hàng quét mã QR Napas SePay thanh toán 100% giá trị đơn hàng.
  - SePay phát tín hiệu Webhook xác nhận tiền đã vào tài khoản; BanquetHub tự động chuyển trạng thái đơn sang Đã thanh toán, khóa vĩnh viễn nguyên liệu cho tiệc và xuất biên lai/hợp đồng điện tử cho khách.
  - *(Trường hợp ngoại lệ)*: Nếu quá 15 phút khách không thanh toán, tác vụ tự động của hệ thống sẽ hủy lệnh giữ chỗ và hoàn trả 100% nguyên liệu về kho.

### 2. Luồng chính 2: Điều phối và Chế biến món tiệc tại Bếp (Kitchen Order Processing & Fulfillment Flow)
- **Tên luồng**: Luồng Tiếp nhận đơn tiệc đã thanh toán -> Bóc tách khối lượng nguyên liệu nấu -> Cập nhật trạng thái Bếp đang nấu -> Hoàn tất phục vụ sự kiện tiệc -> Trừ xuất kho thực tế & Ghi nhận giá vốn tiệc.
- **Tác nhân tham gia**: Nhân viên Bếp, Điều phối viên, Hệ thống Quản trị kho.
- **Mô tả diễn tiến luồng**:
  - Đội ngũ Bếp mở màn hình Quản lý đơn tiệc bếp để theo dõi danh sách các đơn tiệc đã thanh toán thành công và sắp tới ngày tổ chức.
  - Nhân viên bếp xem chi tiết định mức: số lượng bàn, từng món ăn cần chế biến và tổng khối lượng từng loại nguyên liệu cần lấy từ kho.
  - Nhân viên bấm nút Bắt đầu chế biến; đơn hàng chuyển trạng thái sang Đang chuẩn bị tiệc (IN_PROGRESS).
  - Sau khi các món tiệc được nấu chín, vận chuyển đến địa điểm tổ chức và phục vụ hoàn tất cho khách hàng, nhân viên bấm Xác nhận hoàn thành tiệc.
  - Hệ thống chuyển trạng thái đơn sang Hoàn thành (COMPLETED), chính thức trừ kho vật lý đối với lượng nguyên liệu đã dùng và ghi nhận chi phí giá vốn (COGS) vào sổ sách kế toán.

### 3. Luồng chính 3: Quản trị kho và Nhập hàng nguyên liệu từ Nhà cung cấp (Inventory & Purchasing Flow)
- **Tên luồng**: Luồng Giám sát tồn kho an toàn & Cảnh báo sắp hết -> Lập phiếu nhập kho từ Nhà cung cấp -> Cập nhật tăng tồn kho vật lý -> Tính toán lại giá vốn bình quân gia quyền -> Thanh toán công nợ nhà cung cấp.
- **Tác nhân tham gia**: Quản trị viên, Thủ kho, Nhà cung cấp thực phẩm.
- **Mô tả diễn tiến luồng**:
  - Quản trị viên giám sát bảng điều khiển tồn kho; hệ thống tự động gắn nhãn Cảnh báo đỏ đối với các nguyên liệu có số lượng tồn rơi xuống dưới ngưỡng an toàn.
  - Quản trị viên tạo Phiếu nhập kho mới, lựa chọn Nhà cung cấp thực phẩm và nhập chi tiết từng loại nguyên liệu kèm số lượng và đơn giá mua thực tế.
  - Khi xác nhận nhập hàng, hệ thống tự động cộng dồn số lượng vào tồn kho thực tế, đồng thời áp dụng công thức Bình quân gia quyền để tính lại đơn giá vốn bình quân cho từng mặt hàng.
  - Quản trị viên ghi nhận thanh toán tiền cho nhà cung cấp; hệ thống ghi nhật ký biến động kho và cập nhật dòng tiền chi vào hệ thống báo cáo.

### 4. Luồng chính 4: Quản trị Nhân sự, Chấm công và Tính lương tự động (HR, Attendance & Payroll Flow)
- **Tên luồng**: Luồng Nhân viên chấm công hàng ngày -> Quản lý giám sát & Duyệt công -> Tạo kỳ lương tháng mới -> Hệ thống tự động tính lương theo ngày công và phụ cấp -> Ban giám đốc phê duyệt & Chi trả lương.
- **Tác nhân tham gia**: Nhân viên, Quản trị viên / Phòng Nhân sự, Kế toán.
- **Mô tả diễn tiến luồng**:
  - Nhân viên đăng nhập vào hệ thống mỗi ngày để bấm Chấm công vào ca khi đến làm việc và Chấm công tan ca khi hết giờ.
  - Quản lý theo dõi bảng tổng hợp chấm công của toàn bộ nhân sự để kiểm tra tính chuyên cần.
  - Đến cuối tháng, Quản trị viên tạo Kỳ lương mới và kích hoạt lệnh Tính toán bảng lương tự động.
  - Hệ thống tự động tổng hợp số ngày công thực tế của từng người, nhân với mức lương cơ bản, cộng thêm các khoản phụ cấp trách nhiệm/thưởng sự kiện và trừ đi các khoản phạt/tạm ứng.
  - Ban giám đốc kiểm tra và bấm Phê duyệt bảng lương.
  - Nhân viên có thể mở mục Phiếu lương của tôi để tra cứu chi tiết mức lương thực nhận; hệ thống ghi nhận chi phí lương vào báo cáo tài chính.

### 5. Luồng chính 5: Quản trị Chương trình Ưu đãi & Voucher (Voucher Campaign & Discount Flow)
- **Tên luồng**: Luồng Thiết lập mã khuyến mại -> Khách hàng nhập mã thủ công khi đặt tiệc -> Hệ thống kiểm tra điều kiện & Trừ tiền trực tiếp -> Cập nhật số lượt dùng của voucher.
- **Tác nhân tham gia**: Quản trị viên, Khách hàng.
- **Mô tả diễn tiến luồng**:
  - Quản trị viên tạo mới mã Voucher trong mục Quản trị: đặt mã định danh (ví dụ: TIECVIP2026), hình thức giảm (giảm tiền mặt hoặc giảm theo %), mức giảm, giới hạn giảm tối đa, giá trị đơn tối thiểu, tổng số lượt sử dụng và hạn dùng.
  - Khi Khách hàng tiến hành đặt tiệc tại bước thanh toán, khách hàng tự nhập mã voucher vào ô khuyến mãi (hệ thống không cung cấp danh sách chọn sẵn để bảo đảm tính bảo mật của mã ưu đãi).
  - Hệ thống kiểm tra tính hợp lệ: thời hạn, số lượt dùng còn lại, giá trị đơn tiệc hiện tại có đạt ngưỡng tối thiểu hay không.
  - Nếu đủ điều kiện, hệ thống hiển thị số tiền được giảm màu xanh và trừ trực tiếp vào tổng tiền cần thanh toán.
  - Khi đơn tiệc được thanh toán thành công, hệ thống tăng số lượt đã dùng của voucher lên 1 đơn vị.

### 6. Luồng chính 6: Đối soát Dòng tiền và Báo cáo Tài chính Lãi Lỗ P&L (Cashflow Reconciliation & P&L Reporting Flow)
- **Tên luồng**: Luồng Tiếp nhận giao dịch ngân hàng SePay -> Đối soát dòng tiền vào -> Tổng hợp Chi phí nhập kho & Chi phí lương nhân viên -> Tự động sinh Báo cáo Dòng tiền (Cashflow) và Báo cáo Lợi nhuận (P&L).
- **Tác nhân tham gia**: Quản trị viên, Kế toán, Giám đốc điều hành.
- **Mô tả diễn tiến luồng**:
  - Mọi khoản tiền khách chuyển khoản qua SePay đều được ghi nhận vào Sổ đối soát giao dịch ngân hàng. Kế toán có thể rà soát mã tham chiếu và kiểm tra trạng thái khớp đơn tự động.
  - Định kỳ hàng tháng, Quản trị viên truy cập vào phân hệ Báo cáo tài chính.
  - Hệ thống tự động tổng hợp: Doanh thu thuần (tổng tiền các đơn tiệc hoàn thành sau khi trừ voucher), Giá vốn hàng bán (tổng chi phí nguyên liệu bóc tách từ các bữa tiệc theo giá bình quân), Chi phí nhân sự (tổng quỹ lương đã duyệt trong kỳ) và Chi phí vận hành khác.
  - Hệ thống tự động tính ra Lợi nhuận gộp và Lợi nhuận ròng (Net Profit), đồng thời hiển thị bằng biểu đồ trực quan giúp lãnh đạo đưa ra chiến lược kinh doanh chính xác.

---

## PHẦN II: TỔNG QUAN CÁC TÁC NHÂN (ACTORS)

1. **Khách hàng (Customer)**: Người dùng truy cập trang web để tìm kiếm món ăn, tự phối set menu tiệc, nhận tư vấn AI, chọn địa điểm tổ chức, nhập mã giảm giá, đặt tiệc và thanh toán 100% qua Napas QR.
2. **Nhân viên bếp & Điều phối (Employee)**: Đội ngũ phục vụ và đầu bếp tiếp nhận đơn tiệc đã thanh toán thành công, thực hiện chuẩn bị nguyên liệu, chuyển trạng thái nấu tiệc, hoàn thành tiệc, chấm công hàng ngày và tra cứu bảng lương.
3. **Quản trị viên (Admin)**: Chủ nhà hàng hoặc cấp quản lý nắm toàn quyền điều hành: quản lý món ăn và công thức định mức, quản lý kho nguyên liệu và phiếu nhập hàng, đối soát dòng tiền thanh toán SePay, cấu hình mã voucher, duyệt bảng lương và theo dõi báo cáo lãi lỗ (P&L).
4. **Cổng thanh toán SePay PG**: Hệ thống trung gian thanh toán tự động, cung cấp mã QR chuyển khoản liên ngân hàng 24/7 và phát tín hiệu thông báo thanh toán thành công tức thì về BanquetHub.
5. **Trợ lý AI Google Gemini**: Mô hình trí tuệ nhân tạo tiếp nhận thông tin tồn kho và danh mục món ăn thực tế để tư vấn set menu tối ưu theo ngân sách và khẩu vị của khách.

---

## PHẦN III: CÁC USE CASE PHÂN HỆ KHÁCH HÀNG (CUSTOMER PORTAL)

### UC-01: Đăng ký tài khoản và xác thực mã OTP qua Email
- **Tác nhân thực hiện**: Khách hàng mới (Guest / Customer)
- **Mô tả tóm tắt**: Cho phép người dùng mới tạo tài khoản cá nhân trên hệ thống và xác minh hộp thư điện tử chính chủ thông qua mã số bảo mật OTP.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Khách hàng truy cập vào trang Đăng ký tài khoản trên thanh điều hướng.
  - **Bước 2**: Khách hàng nhập đầy đủ thông tin gồm Họ và tên, Số điện thoại, Địa chỉ Email và Mật khẩu đăng nhập.
  - **Bước 3**: Khách hàng bấm nút Đăng ký. Hệ thống kiểm tra tính hợp lệ của dữ liệu, mã hóa mật khẩu và tự động gửi một email chứa mã xác thực OTP (6 chữ số) tới hòm thư của khách.
  - **Bước 4**: Giao diện hiển thị cửa sổ nhập mã OTP kèm đồng hồ đếm ngược hiệu lực 5 phút.
  - **Bước 5**: Khách hàng kiểm tra email, lấy mã OTP và nhập vào màn hình xác nhận rồi bấm Xác minh.
  - **Bước 6**: Hệ thống kiểm tra mã OTP: nếu trùng khớp và còn trong thời hạn, hệ thống kích hoạt tài khoản thành công và tự động chuyển hướng khách hàng tới màn hình Đăng nhập.

---

### UC-02: Đăng nhập hệ thống và duy trì phiên làm việc
- **Tác nhân thực hiện**: Khách hàng, Nhân viên, Quản trị viên
- **Mô tả tóm tắt**: Xác thực danh tính người dùng và cấp phát phiên đăng nhập an toàn theo đúng vai trò.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Người dùng truy cập vào trang Đăng nhập.
  - **Bước 2**: Người dùng nhập địa chỉ Email và Mật khẩu đã đăng ký, sau đó bấm Đăng nhập.
  - **Bước 3**: Hệ thống kiểm tra thông tin tài khoản: xác minh mật khẩu mã hóa và kiểm tra trạng thái kích hoạt.
  - **Bước 4**: Hệ thống tạo mã thông thực phiên đăng nhập lưu trữ an toàn trên trình duyệt của người dùng.
  - **Bước 5**: Hệ thống tự động nhận diện vai trò người dùng: chuyển Khách hàng về Trang chủ hoặc trang Đặt tiệc; chuyển Nhân viên tới trang Bếp điều phối; chuyển Quản trị viên tới Bảng điều khiển Quản trị.

---

### UC-03: Khám phá món ăn và xem chi tiết định mức dinh dưỡng
- **Tác nhân thực hiện**: Khách hàng (Customer)
- **Mô tả tóm tắt**: Cho phép khách hàng duyệt xem toàn bộ menu món tiệc công khai của nhà hàng kèm thông tin giá cả, hình ảnh và khẩu phần.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Khách hàng bấm vào mục Món tiệc trên menu chính của trang web.
  - **Bước 2**: Hệ thống hiển thị danh sách các món ăn được chia theo nhóm: Món khai vị, Món chính, Món lẩu và canh, Món tráng miệng, Đồ uống.
  - **Bước 3**: Khách hàng có thể tìm kiếm món ăn theo tên hoặc chọn bộ lọc theo từng phân loại món.
  - **Bước 4**: Khách hàng bấm vào một món ăn cụ thể để xem trang chi tiết: hình ảnh chất lượng cao, đơn giá niêm yết cho 01 bàn (chuẩn 10 khách), mô tả hương vị và các nguyên liệu chính cấu thành món ăn.

---

### UC-04: Tự phối thực đơn bàn tiệc và kiểm tra tồn kho tự động
- **Tác nhân thực hiện**: Khách hàng (Customer)
- **Mô tả tóm tắt**: Công cụ tương tác cho phép khách hàng tự thiết kế set menu tiệc độc bản cho sự kiện của mình. Hệ thống tự động kiểm tra lượng nguyên liệu trong kho để bảo đảm nhà hàng đủ khả năng cung ứng.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Khách hàng truy cập vào trang Tự phối thực đơn (Menu Builder).
  - **Bước 2**: Khách hàng lựa chọn số lượng bàn tiệc dự kiến (mặc định là 6 bàn tương đương 60 khách, có thể tăng giảm tùy ý từ 1 bàn trở lên).
  - **Bước 3**: Khách hàng chọn từng món ăn mong muốn từ các nhóm thực đơn. Khi chọn món, khách có thể tùy chỉnh số lượng đĩa/phần trên mỗi bàn.
  - **Bước 4**: Ngay khi khách hàng thêm hoặc bớt món, hệ thống tự động bóc tách định mức nguyên liệu cần dùng cho toàn bộ số bàn tiệc và đối soát với số lượng nguyên liệu sẵn có trong kho hàng.
  - **Bước 5**: Hệ thống hiển thị ngay tức thì: Bảng các món đã chọn, đơn giá tạm tính cho 01 bàn, tổng tiền dự kiến cho toàn bộ tiệc, và thông báo kho nguyên liệu đầy đủ sẵn sàng phục vụ.
  - **Bước 6**: Khách hàng bấm nút Tiếp tục đặt tiệc để chuyển toàn bộ thực đơn vừa phối sang trang Xác nhận đặt tiệc.
- **Lưu ý quan trọng**: Nếu một trong các nguyên liệu món đã hết trong kho, hệ thống lập tức thông báo tên món không đủ khả năng phục vụ và tạm thời khóa nút tiếp tục để khách đổi sang món khác, tránh tình trạng nhận tiệc nhưng không có nguyên liệu nấu.

---

### UC-05: Nhận tư vấn thực đơn tiệc thông minh từ Trợ lý AI và Chatbot
- **Tác nhân thực hiện**: Khách hàng (Customer)
- **Mô tả tóm tắt**: Hỗ trợ khách hàng chưa có kinh nghiệm lên thực đơn có thể nhận được các gợi ý chuyên nghiệp từ Trí tuệ nhân tạo Gemini hoặc hỏi đáp thắc mắc với Chatbot.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Khách hàng mở trang Gợi ý AI hoặc bấm vào biểu tượng Chatbot ở góc phải bên dưới màn hình.
  - **Bước 2**: Khách hàng nhập yêu cầu bằng câu từ tự nhiên, ví dụ: "Gợi ý giúp tôi thực đơn tiệc cưới 10 bàn, ngân sách tầm 2 triệu mỗi bàn, món thanh đạm không cay".
  - **Bước 3**: Khách hàng bấm nút Nhờ AI tư vấn.
  - **Bước 4**: Hệ thống gửi yêu cầu kèm theo dữ liệu kho và danh mục món ăn thực tế của nhà hàng tới Trí tuệ nhân tạo Gemini để tính toán.
  - **Bước 5**: Trợ lý AI phản hồi set menu gợi ý hoàn chỉnh: tên thực đơn hấp dẫn, danh sách các món phối vị hài hòa, tổng chi phí dự tính và lời khuyên ẩm thực chuyên nghiệp.
  - **Bước 6**: Khách hàng có thể bấm nút Áp dụng thực đơn này để đưa nguyên set menu do AI vừa tư vấn vào thẳng giỏ đặt tiệc.
- **Lưu ý quan trọng**: Khi khách hàng hỏi Chatbot về chính sách hủy tiệc hoặc hoàn tiền, Chatbot tuân thủ đúng nguyên tắc: thông báo rõ nhà hàng không hoàn tiền tự động trên hệ thống, việc hủy hay dời tiệc được thực hiện căn cứ theo các điều khoản ghi trong Hợp đồng dịch vụ tiệc giữa hai bên.

---

### UC-06: Chọn địa điểm và định vị vị trí tổ chức tiệc trên bản đồ số Mapbox
- **Tác nhân thực hiện**: Khách hàng (Customer)
- **Mô tả tóm tắt**: Hỗ trợ khách hàng nhập địa chỉ tổ chức tiệc chính xác thông qua hệ thống gợi ý địa điểm và bản đồ số trực quan.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Tại màn hình Xác nhận đặt tiệc, khách hàng tới mục Thông tin địa điểm tổ chức tiệc.
  - **Bước 2**: Khách hàng gõ địa chỉ tổ chức vào ô tìm kiếm (ví dụ: số nhà, tên đường, tòa nhà hoặc trung tâm hội nghị).
  - **Bước 3**: Hệ thống hiển thị danh sách các gợi ý địa chỉ chuẩn xác tại Việt Nam từ dữ liệu bản đồ số Mapbox.
  - **Bước 4**: Khách hàng bấm chọn địa chỉ phù hợp nhất trong danh sách gợi ý.
  - **Bước 5**: Bản đồ lập tức hiển thị vị trí được ghim tương ứng, tự động ghi nhận tọa độ kinh độ và vĩ độ để phục vụ công tác điều phối đội ngũ và vận chuyển nguyên liệu sau này.

---

### UC-07: Áp dụng mã ưu đãi / Voucher giảm giá vào đơn tiệc
- **Tác nhân thực hiện**: Khách hàng (Customer)
- **Mô tả tóm tắt**: Khách hàng nhập mã khuyến mãi để được hưởng chiết khấu trực tiếp vào tổng tiền thanh toán của đơn tiệc.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Tại bước xác nhận đặt tiệc, khách hàng di chuyển đến phần Mã ưu đãi / Voucher.
  - **Bước 2**: Khách hàng tự tay nhập mã voucher mà mình có (ví dụ: TIECXUAN2026).
  - **Bước 3**: Khách hàng bấm nút Áp dụng.
  - **Bước 4**: Hệ thống kiểm tra tính hợp lệ của mã: mã có tồn tại không, còn trong thời hạn hay không, đơn hàng hiện tại có đạt số tiền tối thiểu quy định hay không, và khách đã dùng hết lượt cho phép chưa.
  - **Bước 5**: Nếu hợp lệ, hệ thống tính toán số tiền được giảm (giảm tiền mặt cố định hoặc giảm theo tỷ lệ phần trăm) và hiển thị dòng giảm giá màu xanh nổi bật ngay dưới phần tạm tính.
  - **Bước 6**: Hệ thống tự động trừ tiền giảm giá vào tổng tiền cần thanh toán của đơn tiệc.
  - **Bước 7**: Khách hàng có thể bấm nút gỡ bỏ mã bất cứ lúc nào nếu muốn đổi sang mã ưu đãi khác.
- **Lưu ý quan trọng**: Hệ thống chỉ cho phép nhập mã thủ công, không có danh sách chọn sẵn để đảm bảo tính độc quyền của các chương trình ưu đãi.

---

### UC-08: Xác nhận đặt tiệc và kích hoạt lệnh khóa giữ kho 15 phút
- **Tác nhân thực hiện**: Khách hàng (Customer)
- **Mô tả tóm tắt**: Chốt thông tin đặt tiệc, kích hoạt cơ chế giữ chỗ kho nguyên liệu trong 15 phút để đảm bảo không ai khác tranh mua mất nguyên liệu trong lúc khách chuẩn bị thanh toán.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Khách hàng rà soát lại thông tin: người đặt, số điện thoại đón tiếp sự kiện, thời gian tổ chức tiệc, địa điểm bản đồ, số bàn tiệc, danh sách món và số tiền thanh toán cuối cùng.
  - **Bước 2**: Khách hàng bấm nút Xác nhận đặt tiệc.
  - **Bước 3**: Hệ thống mở phiên giao dịch an toàn: kiểm tra tồn kho lần cuối, tạo đơn tiệc mới với trạng thái Chờ thanh toán, ghi nhận mức giảm giá voucher.
  - **Bước 4**: Đồng thời, hệ thống tạo một Lệnh giữ chỗ nguyên liệu tương ứng với thời hạn đúng 15 phút. Lượng nguyên liệu này tạm thời bị khóa lại không cho người khác đặt.
  - **Bước 5**: Hệ thống chuyển khách hàng sang trang Xác nhận đơn hàng thành công, hiển thị đồng hồ đếm ngược 15:00 giữ kho và nút dẫn tới cổng thanh toán trực tuyến.
- **Lưu ý quan trọng**: BanquetHub áp dụng cơ chế thanh toán 100% để bảo đảm nguyên liệu tươi sống cho tiệc, không áp dụng hình thức đặt cọc 50%.

---

### UC-09: Thanh toán trực tuyến 100% qua Napas 24/7 QR SePay
- **Tác nhân thực hiện**: Khách hàng (Customer)
- **Mô tả tóm tắt**: Khách hàng chuyển khoản thanh toán nhanh bằng ứng dụng ngân hàng thông qua mã QR động, hệ thống tự động nhận tiền và kích hoạt đơn tiệc ngay lập tức.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Khách hàng bấm vào nút Thanh toán ngay qua SePay trên đơn hàng.
  - **Bước 2**: Trình duyệt mở màn hình thanh toán SePay hiển thị mã QR thanh toán chuẩn Napas 24/7, có sẵn số tiền thanh toán 100% và nội dung chuyển khoản định danh riêng cho đơn hàng.
  - **Bước 3**: Khách hàng mở ứng dụng ngân hàng trên điện thoại (Mobile Banking), chọn chức năng Quét mã QR và quét mã hiển thị trên màn hình.
  - **Bước 4**: Ứng dụng ngân hàng tự động điền đúng số tiền và nội dung chuyển khoản, khách hàng xác nhận thực hiện chuyển tiền.
  - **Bước 5**: Ngay khi ngân hàng ghi nhận tiền vào tài khoản nhà hàng, cổng SePay tự động bắn tín hiệu xác thực về hệ thống BanquetHub.
  - **Bước 6**: BanquetHub kiểm tra số tiền khớp đúng 100%, tự động chuyển trạng thái đơn hàng sang Đã thanh toán, khóa vĩnh viễn nguyên liệu cho đơn tiệc này và tắt đồng hồ đếm ngược.
  - **Bước 7**: Màn hình của khách hàng tự động cập nhật ngay sang thông báo Đã thanh toán thành công và gửi biên lai xác nhận qua email của khách.

---

### UC-10: Tự động hoàn trả tồn kho khi đơn tiệc hết hạn thanh toán
- **Tác nhân thực hiện**: Hệ thống tự động (Scheduled Worker)
- **Mô tả tóm tắt**: Giải phóng nguyên liệu bị khóa nếu khách hàng không thanh toán trong vòng 15 phút, tránh việc kho bị giam giữ ảo gây thiệt hại cho nhà hàng.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Hệ thống chạy tác vụ quét tự động ngầm định kỳ mỗi phút.
  - **Bước 2**: Hệ thống phát hiện đơn hàng vẫn ở trạng thái Chờ thanh toán nhưng thời gian giữ kho 15 phút đã kết thúc.
  - **Bước 3**: Hệ thống tự động cập nhật trạng thái đơn tiệc thành Hết hạn giữ chỗ.
  - **Bước 4**: Lệnh giữ chỗ kho tương ứng được giải phóng, toàn bộ lượng nguyên liệu định mức được hoàn trả lại ngay lập tức vào số lượng tồn kho sẵn có.
  - **Bước 5**: Trên giao diện của khách hàng, đồng hồ đếm ngược chuyển về 00:00, nút thanh toán được ẩn đi và xuất hiện nút Tái tạo đơn tiệc này để hỗ trợ khách đặt lại thực đơn nếu vẫn còn nhu cầu.

---

### UC-11: Theo dõi tiến độ chuẩn bị tiệc và in hợp đồng biên lai
- **Tác nhân thực hiện**: Khách hàng (Customer)
- **Mô tả tóm tắt**: Khách hàng có thể tra cứu danh sách các buổi tiệc đã đặt và theo dõi từng bước phục vụ của nhà hàng.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Khách hàng vào mục Đơn tiệc của tôi trên thanh điều hướng.
  - **Bước 2**: Hệ thống hiển thị toàn bộ các đơn tiệc của khách hàng được sắp xếp theo thời gian, kèm bộ lọc theo trạng thái: Chờ thanh toán, Đã thanh toán, Đang chuẩn bị, Hoàn thành, Hết hạn, Đã hủy.
  - **Bước 3**: Khách hàng bấm Xem chi tiết vào một đơn tiệc cụ thể.
  - **Bước 4**: Hệ thống hiển thị chi tiết tiến trình phục vụ theo thời gian thực (Đã nhận đơn -> Bếp đang nấu -> Đang phục vụ tiệc -> Hoàn thành tiệc).
  - **Bước 5**: Khách hàng có thể xem lại đầy đủ thông tin: danh sách món, đơn giá từng bàn, tiền giảm giá voucher, tổng thanh toán và bấm nút In hợp đồng tiệc để lưu trữ file PDF hoặc in giấy.

---

## PHẦN IV: CÁC USE CASE PHÂN HỆ NHÂN VIÊN & BẾP (EMPLOYEE PORTAL)

### UC-12: Tiếp nhận đơn tiệc và chuẩn bị nguyên liệu nấu bếp
- **Tác nhân thực hiện**: Nhân viên bếp / Điều phối (Employee)
- **Mô tả tóm tắt**: Đội ngũ bếp xem lịch phục vụ tiệc sắp tới để xuất kho nguyên liệu và triển khai chế biến món ăn.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Nhân viên đăng nhập tài khoản nhân viên và mở mục Quản lý đơn tiệc bếp.
  - **Bước 2**: Nhân viên xem danh sách các tiệc đã thanh toán hợp lệ kèm ngày giờ tổ chức và địa điểm.
  - **Bước 3**: Nhân viên bấm vào chi tiết đơn tiệc để xem bảng kê chi tiết: số lượng bàn, từng món ăn cần nấu, tổng số suất ăn cần làm, và khối lượng từng loại nguyên liệu cần sử dụng từ kho.
  - **Bước 4**: Nhân viên bấm nút Bắt đầu chế biến tiệc.
  - **Bước 5**: Hệ thống chuyển trạng thái đơn hàng sang Đang chuẩn bị tiệc, đồng thời ghi nhận việc xuất kho nguyên liệu vật lý thực tế phục vụ cho ca nấu.

---

### UC-13: Xác nhận hoàn thành phục vụ sự kiện tiệc
- **Tác nhân thực hiện**: Nhân viên bếp / Điều phối (Employee), Quản trị viên (Admin)
- **Mô tả tóm tắt**: Đóng chu trình phục vụ sau khi buổi tiệc kết thúc thành công tại địa điểm khách hàng.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Sau khi buổi tiệc kết thúc và khách hàng đã nghiệm thu dịch vụ tiệc hoàn tất, nhân viên mở lại chi tiết đơn tiệc trên hệ thống.
  - **Bước 2**: Nhân viên bấm nút Xác nhận hoàn thành tiệc.
  - **Bước 3**: Hệ thống ghi nhận thời điểm hoàn tất, chuyển trạng thái đơn tiệc sang Hoàn thành và tự động đưa số liệu doanh thu, chi phí của buổi tiệc vào sổ sách kế toán để tính lợi nhuận.

---

### UC-14: Nhân viên chấm công ca làm việc hàng ngày
- **Tác nhân thực hiện**: Nhân viên (Employee)
- **Mô tả tóm tắt**: Ghi nhận ngày làm việc thực tế của nhân viên để làm căn cứ tính lương cuối tháng.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Khi đến làm việc tại nhà hàng hoặc điểm tiệc, nhân viên mở trang Chấm công cá nhân.
  - **Bước 2**: Nhân viên bấm nút Chấm công vào ca.
  - **Bước 3**: Hệ thống ghi nhận ngày giờ vào ca làm việc thực tế.
  - **Bước 4**: Khi kết thúc ca làm việc, nhân viên bấm Chấm công tan ca.
  - **Bước 5**: Hệ thống lưu lại bản ghi chấm công trong ngày (Đi đủ ca, Nửa ca, hoặc Vắng mặt) vào cơ sở dữ liệu.

---

### UC-15: Nhân viên tra cứu phiếu lương cá nhân hàng tháng
- **Tác nhân thực hiện**: Nhân viên (Employee)
- **Mô tả tóm tắt**: Giúp nhân viên minh bạch theo dõi mức lương, các khoản phụ cấp và các khoản trừ lương trong tháng.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Nhân viên truy cập mục Phiếu lương của tôi.
  - **Bước 2**: Hệ thống hiển thị danh sách các kỳ lương hàng tháng đã được Ban giám đốc phê duyệt.
  - **Bước 3**: Nhân viên chọn xem một kỳ lương cụ thể: hệ thống hiển thị chi tiết số ngày công thực tế, mức lương cơ bản, tiền phụ cấp trách nhiệm, tiền thưởng sự kiện, các khoản giảm trừ và tổng số tiền lương thực nhận được chuyển khoản.

---

## PHẦN V: CÁC USE CASE PHÂN HỆ QUẢN TRỊ TRUNG TÂM (ADMIN PORTAL)

### UC-16: Quản lý danh mục món ăn và công thức định mức nguyên liệu (BOM)
- **Tác nhân thực hiện**: Quản trị viên (Admin)
- **Mô tả tóm tắt**: Cấu hình các món ăn bán trên website và thiết lập công thức chi tiết từng gam nguyên liệu cần dùng cho mỗi món.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Quản trị viên mở trang Quản lý Thực đơn & Món ăn tại phân hệ quản trị.
  - **Bước 2**: Admin có thể thêm mới món ăn: nhập tên món, chọn nhóm món (Khai vị, Món chính, Lẩu...), tải ảnh đại diện món, đặt đơn giá cho 01 bàn tiệc.
  - **Bước 3**: Admin tiến hành cấu hình định mức nguyên liệu (Recipe/BOM): chọn các nguyên liệu cấu thành món từ danh mục kho và nhập định lượng chuẩn xác (ví dụ: Món Bò né cần 0.8 kg Thịt bò, 0.1 kg Bơ, 0.2 kg Hành tây).
  - **Bước 4**: Hệ thống tự động tính toán chi phí giá vốn lý thuyết của món dựa trên giá bình quân của các nguyên liệu cấu thành.
  - **Bước 5**: Admin bấm Lưu thông tin. Món ăn mới lập tức xuất hiện trên website để khách hàng có thể chọn đặt.

---

### UC-17: Lập phiếu nhập kho nguyên liệu và cập nhật giá vốn bình quân
- **Tác nhân thực hiện**: Quản trị viên / Thủ kho (Admin)
- **Mô tả tóm tắt**: Nhập thêm hàng hóa nguyên liệu từ nhà cung cấp vào kho, hệ thống tự động cộng số lượng tồn và cập nhật giá vốn hàng hóa theo phương pháp bình quân gia quyền.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Quản trị viên mở trang Nhập hàng và bấm nút Tạo phiếu nhập mới.
  - **Bước 2**: Admin lựa chọn Nhà cung cấp thực phẩm từ danh sách đối tác.
  - **Bước 3**: Admin thêm từng dòng nguyên liệu nhập về: chọn tên nguyên liệu, số lượng nhập theo cân/hộp/chai và đơn giá nhập thực tế trên hóa đơn.
  - **Bước 4**: Hệ thống tự tính toán tổng tiền phiếu nhập và hiển thị tổng số tiền phải trả.
  - **Bước 5**: Admin nhập số tiền đã thanh toán cho nhà cung cấp và bấm Xác nhận nhập kho.
  - **Bước 6**: Hệ thống cập nhật ngay lập tức: cộng số lượng vào tồn kho thực tế, tính toán lại đơn giá vốn bình quân mới cho từng nguyên liệu, ghi nhật ký vào Sổ biến động kho và cập nhật công nợ nhà cung cấp.

---

### UC-18: Giám sát tồn kho khả dụng và xem cảnh báo nguyên liệu sắp hết
- **Tác nhân thực hiện**: Quản trị viên (Admin)
- **Mô tả tóm tắt**: Theo dõi tình trạng hàng hóa trong kho theo thời gian thực để kịp thời nhập thêm hàng, đảm bảo không bị gián đoạn hoạt động kinh doanh tiệc.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Admin truy cập trang Tổng quan kho & Nguyên liệu.
  - **Bước 2**: Hệ thống hiển thị danh mục toàn bộ nguyên liệu kèm các chỉ số quan trọng: Tổng số lượng tồn vật lý trong kho, Số lượng đang bị các đơn đặt tiệc khóa giữ chỗ, và Số lượng tồn thực tế còn sẵn sàng nhận tiệc.
  - **Bước 3**: Những nguyên liệu có số tồn thấp hơn mức an toàn tối thiểu được hệ thống tự động gắn nhãn cảnh báo đỏ Cần nhập thêm hàng.
  - **Bước 4**: Admin có thể xem lịch sử chi tiết mọi lần biến động của nguyên liệu trong mục Sổ biến động kho.

---

### UC-19: Quản lý Mã ưu đãi và cấu hình các hạn mức Voucher
- **Tác nhân thực hiện**: Quản trị viên (Admin)
- **Mô tả tóm tắt**: Tạo lập và kiểm soát các chương trình khuyến mại, mã giảm giá để kích cầu đặt tiệc mà vẫn đảm bảo an toàn tài chính cho nhà hàng.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Admin truy cập trang Quản lý Voucher trên menu điều hướng bên trái.
  - **Bước 2**: Hệ thống hiển thị bảng thống kê tổng số voucher, voucher đang chạy và tổng số lượt khách đã sử dụng.
  - **Bước 3**: Admin bấm nút Thêm voucher mới và nhập các điều kiện: Mã voucher (ví dụ: TIECVIP1TR), Tên chương trình, Hình thức giảm (Số tiền mặt hoặc Phần trăm %), Giá trị giảm, Giới hạn giảm tối đa (để chặn rủi ro đơn quá lớn), Giá trị đơn tiệc tối thiểu được dùng mã, Tổng số lượt dùng toàn sàn, Số lượt tối đa cho mỗi khách hàng và Thời hạn áp dụng.
  - **Bước 4**: Admin bấm Lưu voucher. Mã voucher mới được đưa vào hoạt động ngay.
  - **Bước 5**: Admin có thể tạm ngưng nhanh một mã voucher bất kỳ lúc nào bằng nút bật/tắt trạng thái ngay trên bảng danh sách mà không cần xóa mã.

---

### UC-20: Đối soát giao dịch thanh toán ngân hàng trực tuyến
- **Tác nhân thực hiện**: Quản trị viên / Kế toán (Admin)
- **Mô tả tóm tắt**: Giám sát toàn bộ dòng tiền thanh toán chuyển khoản qua SePay, xử lý các trường hợp ngoại lệ chuyển khoản chậm hoặc sai nội dung.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Kế toán mở trang Thanh toán & Đối soát tại phân hệ quản trị.
  - **Bước 2**: Hệ thống hiển thị danh sách toàn bộ các giao dịch chuyển khoản ngân hàng tự động kèm trạng thái đối soát: Đã khớp đơn tự động, Chờ đối soát kế toán, hoặc Chưa khớp.
  - **Bước 3**: Kế toán kiểm tra mã tham chiếu ngân hàng, số tài khoản, số tiền thực nhận và mã đơn tiệc tương ứng.
  - **Bước 4**: Trong trường hợp khách hàng chuyển khoản muộn khi đơn hàng đã bị quá hạn 15 phút nhưng nhà hàng vẫn đủ nguyên liệu phục vụ, kế toán bấm nút Xác nhận kích hoạt đơn thủ công để kích hoạt lại đơn tiệc cho khách.
  - **Bước 5**: Hệ thống ghi nhận lịch sử duyệt của kế toán và chuyển đơn sang trạng thái Đã thanh toán an toàn.

---

### UC-21: Quản trị hồ sơ nhân sự, chấm công và tự động tính bảng lương
- **Tác nhân thực hiện**: Quản trị viên / Nhân sự (Admin)
- **Mô tả tóm tắt**: Quản lý nhân viên nhà hàng, phê duyệt ngày công và tính toán tự động lương thực nhận mỗi tháng.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Admin mở trang Quản lý nhân viên để quản lý hồ sơ: hợp đồng làm việc, chức vụ, mức lương cơ bản và tài khoản hệ thống của nhân viên.
  - **Bước 2**: Vào cuối tháng, Admin mở trang Chấm công để duyệt bảng công tổng hợp của toàn thể nhân viên.
  - **Bước 3**: Admin chuyển sang mục Kỳ lương, tạo kỳ lương tháng mới và bấm nút Tính toán bảng lương tự động.
  - **Bước 4**: Hệ thống tự động quét số ngày công thực tế của từng nhân viên, tính ra lương thời gian, cộng phụ cấp và tiền thưởng sự kiện, trừ các khoản phạt/tạm ứng và xuất ra bảng lương hoàn chỉnh.
  - **Bước 5**: Admin kiểm tra lại các con số, sau đó bấm Phê duyệt bảng lương để phát hành phiếu lương cho nhân viên và chuyển số liệu sang phòng kế toán chi tiền.

---

### UC-22: Báo cáo phân tích Doanh thu, Chi phí giá vốn và Lợi nhuận (P&L)
- **Tác nhân thực hiện**: Quản trị viên / Giám đốc điều hành (Admin)
- **Mô tả tóm tắt**: Cung cấp bức tranh tài chính toàn diện giúp chủ nhà hàng nắm rõ hiệu quả kinh doanh của từng tháng.
- **Luồng hoạt động chính từng bước (Main Flow)**:
  - **Bước 1**: Quản trị viên truy cập trang Báo cáo lợi nhuận (P&L) hoặc Báo cáo dòng tiền.
  - **Bước 2**: Admin chọn khoảng thời gian cần phân tích (theo tháng, theo quý hoặc theo năm).
  - **Bước 3**: Hệ thống tự động tổng hợp số liệu từ các phân hệ: Doanh thu thực tế từ các đơn tiệc đã phục vụ hoàn tất (sau khi trừ chiết khấu voucher), Chi phí giá vốn nguyên liệu xuất kho theo giá bình quân, Chi phí lương nhân viên đã trả trong kỳ, và Chi phí vận hành khác.
  - **Bước 4**: Hệ thống tính toán các chỉ số kinh doanh then chốt: Lợi nhuận gộp, Tỷ suất lợi nhuận gộp và Lợi nhuận thuần thực tế.
  - **Bước 5**: Giao diện biểu diễn bằng biểu đồ trực quan (cơ cấu doanh thu chi phí, biểu đồ tăng trưởng qua các tháng) và bảng số liệu phân tích chi tiết để hỗ trợ việc ra quyết định kinh doanh.

---

## PHẦN VI: TỔNG KẾT VÀ GIÁ TRỊ THỰC TIỄN CỦA HỆ THỐNG

Toàn bộ 6 Luồng chính và 22 Use Case trên được xây dựng gắn liền với thực tế vận hành của hệ thống BanquetHub:
- **Tính tự động hóa cao**: Khách tự phối món -> kho tự kiểm tra -> hệ thống tự khóa giữ nguyên liệu 15 phút -> SePay tự nhận tiền Napas QR và kích hoạt đơn mà không cần sự can thiệp thủ công của con người.
- **Chống thất thoát và gián đoạn vận hành**: Cơ chế tự động hoàn kho khi hết hạn thanh toán bảo đảm nguyên liệu không bị giam ảo; định mức nguyên liệu (BOM) và giá vốn bình quân gia quyền giúp nhà hàng kiểm soát chính xác 100% chi phí giá vốn của từng bữa tiệc.
- **Phân quyền bảo mật chặt chẽ**: Ranh giới rõ ràng giữa quyền lợi của Khách hàng, trách nhiệm của Nhân viên bếp và quyền hạn tối cao của Quản trị viên điều hành.
