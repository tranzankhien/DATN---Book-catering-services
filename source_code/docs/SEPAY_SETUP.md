# Cấu hình SePay Sandbox

1. Đăng nhập trang quản trị SePay, mở Cổng thanh toán và bật Sandbox. Lấy Merchant ID và Secret Key của đơn vị Sandbox.
2. Điền `SEPAY_MERCHANT_ID`, `SEPAY_SECRET_KEY` vào `.env` local trên backend. Secret ký form chỉ được backend sử dụng.
3. Trong cấu hình IPN của SePay, chọn `SECRET_KEY` và đặt một khóa riêng. Điền cùng giá trị vào `SEPAY_IPN_SECRET`. URL IPN phải là HTTPS công khai tới `POST /api/v1/payments/sepay/ipn`.
4. Đặt `SEPAY_RETURN_URL` thành URL công khai của trang frontend `/payment/result` dùng cho lượt test. Backend đính kèm mã hóa đơn. Trang kết quả đọc trạng thái từ backend.
5. Khởi động lại ứng dụng. Flyway V14 cập nhật schema và kết thúc các attempt cũ đang chờ trong BanquetHub. Tạo đơn mới, chọn Thanh toán với SePay và thử trên Sandbox.

Admin có thể truy vấn hóa đơn từ màn hình thanh toán khi IPN chưa tới. Chỉ giao dịch đã xác thực qua IPN hoặc API SePay mới có thể cập nhật đơn và xuất kho. Kiểm tra email, số lượng trừ và lịch sử sau giao dịch.

- [Nhận thông tin Sandbox](https://developer.sepay.vn/vi/cong-thanh-toan/sandbox)
- [Thiết lập IPN](https://developer.sepay.vn/vi/cong-thanh-toan/IPN)
