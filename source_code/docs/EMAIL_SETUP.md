# Cấu hình email

Đặt `APP_FRONTEND_URL` thành URL frontend khách truy cập được, ví dụ `https://banquet.example.com`. Link trong email dùng `APP_FRONTEND_URL` theo mặc định. Đặt `APP_WEBSITE_URL` khi cần một URL frontend khác dành cho email.
Đặt EMAIL_WORKER_ENABLED=true, MAIL_HOST, MAIL_PORT và MAIL_FROM. Với SMTP yêu cầu đăng nhập, đặt MAIL_SMTP_AUTH=true, MAIL_USERNAME, MAIL_PASSWORD và MAIL_STARTTLS_ENABLE=true nếu máy chủ hỗ trợ STARTTLS. Để thử local có thể chạy Mailpit với SMTP cổng 1025 và xem inbox cổng 8025.

Với SMTP dùng TLS trực tiếp, đặt MAIL_SSL=true và dùng cổng tương ứng của máy chủ.

Email được lưu vào outbox ngay trong transaction nghiệp vụ. Worker gửi sau commit, ghi số lần thử và kết quả. Admin xem lỗi và thử lại từ /admin/payments, tab Email. Một sự kiện cho mỗi đơn và loại email. SMTP có thể gửi trùng nếu máy chủ đã nhận thư nhưng kết nối bị ngắt trước khi báo kết quả.
