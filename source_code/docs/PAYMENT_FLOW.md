# Thanh toán và xử lý đơn

Khách tạo đơn và giữ kho tối đa 15 phút. Backend ký form SePay Sandbox bằng HMAC-SHA256 và nhận số tiền từ đơn. Trình duyệt gửi form bằng POST tới SePay. Return URL chỉ mở trang kết quả để truy vấn trạng thái theo hóa đơn.

IPN POST xác thực `X-Secret-Key` riêng của merchant và kiểm tra hóa đơn, tiền tệ, số tiền, trạng thái đơn và giao dịch. Đối soát qua API SePay sử dụng Basic Auth từ backend. Cả hai đi qua cùng luồng ghi nhận. Database khóa đơn, giao dịch và nguyên liệu theo thứ tự. Khi thành công, hệ thống ghi giá vốn, xuất kho theo snapshot, ghi lịch sử và tạo email outbox trong một transaction.

SePay có thể báo tiền về sau khi thời hạn giữ kho nội bộ kết thúc. Giao dịch thanh toán ngoài hạn, thiếu thời điểm hợp lệ hoặc không còn đủ nguyên liệu được đưa vào đối soát. Admin có thể kiểm tra lại và xử lý ngoại lệ bằng mã chứng từ. Hoàn tiền và phục hồi tồn do đảo giao dịch được xử lý thủ công.

V14 giữ lịch sử từ cổng cũ, đồng thời ngừng phát lại các phiên thanh toán cũ. Nếu còn giao dịch cũ đang xử lý ngoài hệ thống, Admin cần kiểm tra trực tiếp với cổng cũ.

Sau khi thanh toán, Admin hoặc nhân viên chuyển PAID → PREPARING → COMPLETED.
