package com.banquethub.modules.auth.service;

import com.banquethub.common.exception.DuplicateResourceException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.common.security.JwtTokenProvider;
import com.banquethub.modules.auth.dto.AuthResponse;
import com.banquethub.modules.auth.dto.LoginRequest;
import com.banquethub.modules.auth.dto.RegisterRequest;
import com.banquethub.modules.users.dto.UserResponse;
import com.banquethub.modules.users.entity.Role;
import com.banquethub.modules.users.entity.User;
import com.banquethub.modules.users.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final org.springframework.mail.javamail.JavaMailSender mailSender;
    private final String mailFrom;

    private static final java.time.ZoneId VN_ZONE = java.time.ZoneId.of("Asia/Ho_Chi_Minh");

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            @org.springframework.beans.factory.annotation.Autowired(required = false) org.springframework.mail.javamail.JavaMailSender mailSender,
            @org.springframework.beans.factory.annotation.Value("${spring.mail.username:${app.email.from:noreply@banquethub.vn}}") String mailFrom
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
    }

    private void sendVerificationEmail(String toEmail, String fullName, String code) {
        log.info("Khởi tạo gửi email xác thực tài khoản tới: [{}], OTP code: [{}]", toEmail, code);
        if (mailSender == null) {
            log.warn("JavaMailSender chưa được cấu hình. Bỏ qua gửi SMTP thực tế.");
            return;
        }

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
                org.springframework.mail.javamail.MimeMessageHelper helper =
                        new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");

                String from = (mailFrom != null && !mailFrom.isBlank()) ? mailFrom : "vuhoainammmm2k3@gmail.com";
                helper.setFrom(from, "BanquetHub - Ẩm Thực Yến Tiệc");
                helper.setTo(toEmail);

                String timeStr = java.time.LocalTime.now(VN_ZONE).format(java.time.format.DateTimeFormatter.ofPattern("HH:mm:ss"));
                helper.setSubject(String.format("[BanquetHub] Mã xác thực OTP: %s (Lúc %s)", code, timeStr));

                helper.setPriority(1);
                message.addHeader("X-Priority", "1");
                message.addHeader("X-MSMail-Priority", "High");
                message.addHeader("Importance", "High");

                String safeName = (fullName != null && !fullName.isBlank()) ? org.springframework.web.util.HtmlUtils.htmlEscape(fullName) : "Quý khách";
                String html = """
                    <!doctype html>
                    <html lang="vi">
                    <head>
                        <meta charset="utf-8" />
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                        <title>Mã xác thực tài khoản BanquetHub</title>
                        <style>
                            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                        </style>
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917; -webkit-font-smoothing: antialiased;">
                        <!-- Preheader snippet -->
                        <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">
                            [BanquetHub] Mã xác thực tài khoản thành viên của bạn: %s. Hiệu lực trong 15 phút.
                        </div>

                        <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color: #fafaf9; padding: 40px 12px;">
                            <tr>
                                <td align="center">
                                    <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 10px 25px -5px rgba(28, 25, 23, 0.05), 0 8px 10px -6px rgba(28, 25, 23, 0.02);">
                                        
                                        <!-- Top Accent Gold Bar -->
                                        <tr>
                                            <td height="4" style="background: linear-gradient(90deg, #b45309 0%%, #d97706 50%%, #78350f 100%%); font-size: 0; line-height: 0;">&nbsp;</td>
                                        </tr>

                                        <!-- BanquetHub Brand Header -->
                                        <tr>
                                            <td style="padding: 28px 36px 20px 36px; text-align: center; border-bottom: 1px solid #f5f5f4;">
                                                <table role="presentation" align="center" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td valign="middle" style="padding-right: 10px;">
                                                            <div style="width: 38px; height: 38px; background: linear-gradient(135deg, #b45309 0%%, #78350f 100%%); border-radius: 10px; text-align: center; line-height: 38px; color: #ffffff; font-size: 20px; font-weight: 800; box-shadow: 0 2px 6px rgba(180, 83, 9, 0.25);">B</div>
                                                        </td>
                                                        <td valign="middle" align="left">
                                                            <div style="line-height: 1.1;">
                                                                <span style="font-size: 22px; font-weight: 800; color: #1c1917; letter-spacing: -0.5px;">Banquet</span><span style="font-size: 22px; font-weight: 800; color: #b45309; letter-spacing: -0.5px;">Hub</span>
                                                            </div>
                                                            <div style="font-size: 10px; font-weight: 600; color: #78716c; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 3px;">Ẩm thực yến tiệc</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>

                                        <!-- Hero Content -->
                                        <tr>
                                            <td style="padding: 30px 36px 10px 36px; text-align: center;">
                                                <div style="margin-bottom: 14px;">
                                                    <span style="display: inline-block; background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 5px 14px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                                                        Bảo mật &bull; Xác thực tài khoản
                                                    </span>
                                                </div>
                                                <h1 style="font-size: 22px; font-weight: 800; color: #1c1917; margin: 0 0 12px 0; letter-spacing: -0.5px;">
                                                    Mã kích hoạt tài khoản
                                                </h1>
                                                <p style="font-size: 13.5px; color: #57534e; line-height: 1.6; margin: 0 0 24px 0;">
                                                    Kính chào <strong>%s</strong>, cảm ơn bạn đã đăng ký tài khoản thành viên tại BanquetHub. Vui lòng nhập mã OTP xác thực 6 số dưới đây để kích hoạt tài khoản:
                                                </p>
                                            </td>
                                        </tr>

                                        <!-- OTP Code Box -->
                                        <tr>
                                            <td style="padding: 0 36px;">
                                                <div style="background-color: #fffbeb; border: 1.5px solid #fde68a; border-radius: 14px; padding: 24px; text-align: center; margin-bottom: 24px;">
                                                    <div style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #b45309; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, monospace; padding-left: 12px;">%s</div>
                                                    <div style="display: inline-block; margin-top: 10px; background-color: #fef3c7; color: #92400e; font-size: 11.5px; font-weight: 600; padding: 3px 12px; border-radius: 9999px;">
                                                        Hiệu lực trong vòng 15 phút
                                                    </div>
                                                </div>

                                                <!-- Security Notice Box -->
                                                <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 14px 18px; margin-bottom: 28px; font-size: 12.5px; color: #57534e; line-height: 1.6;">
                                                    <strong style="color: #b45309;">Lưu ý an toàn:</strong><br />
                                                    &bull; Tuyệt đối không chia sẻ mã xác thực này cho bất kỳ ai, kể cả nhân viên BanquetHub.<br />
                                                    &bull; Nếu bạn không thực hiện yêu cầu đăng ký này, vui lòng bỏ qua thư điện tử này.
                                                </div>
                                            </td>
                                        </tr>

                                        <!-- BanquetHub Footer -->
                                        <tr>
                                            <td style="background-color: #fafaf9; padding: 24px 36px; text-align: center; border-top: 1px solid #e7e5e4; font-size: 11.5px; color: #78716c; line-height: 1.6;">
                                                <div style="font-weight: 700; color: #1c1917; margin-bottom: 4px; font-size: 12px;">Công ty Cổ phần Công nghệ Yến tiệc BanquetHub</div>
                                                <div style="margin-bottom: 4px;">Tòa nhà BanquetHub, 120 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3, TP.HCM</div>
                                                <div>Hotline CSKH: <strong style="color: #b45309;">1900 8888</strong> &bull; Email: <a href="mailto:cskh@banquethub.vn" style="color: #b45309; text-decoration: none; font-weight: 600;">cskh@banquethub.vn</a></div>
                                                <div style="margin-top: 10px; font-size: 10.5px; color: #a8a29e;">&copy; 2026 BanquetHub Corporation. All rights reserved. Tiên phong giải pháp công nghệ yến tiệc &amp; catering minh bạch tại Việt Nam.</div>
                                            </td>
                                        </tr>

                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                """.formatted(code, safeName, code);
                helper.setText(html, true);
                mailSender.send(message);
                log.info("Đã gửi email xác thực tài khoản thành công tới {}", toEmail);
            } catch (Exception ex) {
                log.error("Lỗi khi gửi email xác thực tới {}: {}", toEmail, ex.getMessage(), ex);
            }
        });
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        java.util.Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);
        if (existingUserOpt.isPresent()) {
            User existing = existingUserOpt.get();
            if (existing.isEmailVerified()) {
                throw new DuplicateResourceException("Email '" + normalizedEmail + "' đã được đăng ký và kích hoạt trong hệ thống. Vui lòng đăng nhập.");
            }
            // User registered previously but never completed OTP email verification -> Update info and resend new OTP
            String verificationCode = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));
            java.time.OffsetDateTime expiresAt = java.time.OffsetDateTime.now(VN_ZONE).plusMinutes(15);
            existing.setFullName(request.getFullName().trim());
            existing.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            existing.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
            existing.setVerificationCode(verificationCode);
            existing.setVerificationExpiresAt(expiresAt);
            existing.setActive(true);
            User saved = userRepository.save(existing);

            sendVerificationEmail(saved.getEmail(), saved.getFullName(), verificationCode);

            // Strict & Secure: Do NOT leak verification code or issue token before email verification is complete!
            return new AuthResponse(null, 0, UserResponse.fromEntity(saved), true, null);
        }

        String verificationCode = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));
        java.time.OffsetDateTime expiresAt = java.time.OffsetDateTime.now(VN_ZONE).plusMinutes(15);

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        user.setRole(Role.ROLE_USER);
        user.setActive(true);
        user.setEmailVerified(false);
        user.setVerificationCode(verificationCode);
        user.setVerificationExpiresAt(expiresAt);

        User saved = userRepository.save(user);

        sendVerificationEmail(saved.getEmail(), saved.getFullName(), verificationCode);

        // Strict & Secure: Do NOT leak verification code or issue token before email verification is complete!
        return new AuthResponse(null, 0, UserResponse.fromEntity(saved), true, null);
    }

    @Transactional
    public AuthResponse verifyEmail(com.banquethub.modules.auth.dto.VerifyEmailRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email: " + normalizedEmail));

        if (user.isEmailVerified()) {
            CustomUserDetails userDetails = new CustomUserDetails(user);
            String token = jwtTokenProvider.generateToken(userDetails);
            return new AuthResponse(token, jwtTokenProvider.getExpirationMs(), UserResponse.fromEntity(user), false, null);
        }

        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(request.getCode().trim())) {
            throw new BadCredentialsException("Mã xác thực email không chính xác");
        }

        if (user.getVerificationExpiresAt() != null && java.time.OffsetDateTime.now(VN_ZONE).isAfter(user.getVerificationExpiresAt())) {
            throw new BadCredentialsException("Mã xác thực email đã hết hạn. Vui lòng bấm gửi lại mã mới.");
        }

        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationExpiresAt(null);
        user.setLastLoginAt(java.time.OffsetDateTime.now(VN_ZONE));
        User saved = userRepository.save(user);

        CustomUserDetails userDetails = new CustomUserDetails(saved);
        String token = jwtTokenProvider.generateToken(userDetails);
        return new AuthResponse(token, jwtTokenProvider.getExpirationMs(), UserResponse.fromEntity(saved), false, null);
    }

    @Transactional
    public String resendVerification(com.banquethub.modules.auth.dto.ResendVerificationRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email: " + normalizedEmail));

        if (user.isEmailVerified()) {
            throw new com.banquethub.common.exception.BusinessValidationException("Tài khoản này đã được xác thực email trước đó.");
        }

        String newCode = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));
        user.setVerificationCode(newCode);
        user.setVerificationExpiresAt(java.time.OffsetDateTime.now(VN_ZONE).plusMinutes(15));
        userRepository.save(user);

        sendVerificationEmail(user.getEmail(), user.getFullName(), newCode);

        return "Mã xác thực mới đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư đến (Inbox) hoặc Spam.";
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Email hoặc mật khẩu không chính xác"));

        if (!user.isActive()) {
            throw new BadCredentialsException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Email hoặc mật khẩu không chính xác");
        }

        if (!user.isEmailVerified()) {
            String newCode = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));
            user.setVerificationCode(newCode);
            user.setVerificationExpiresAt(java.time.OffsetDateTime.now(VN_ZONE).plusMinutes(15));
            userRepository.save(user);
            sendVerificationEmail(user.getEmail(), user.getFullName(), newCode);
            return new AuthResponse(null, 0, UserResponse.fromEntity(user), true, null);
        }

        user.setLastLoginAt(java.time.OffsetDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")));
        userRepository.save(user);

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String token = jwtTokenProvider.generateToken(userDetails);

        return new AuthResponse(token, jwtTokenProvider.getExpirationMs(), UserResponse.fromEntity(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản hiện tại"));
        return UserResponse.fromEntity(user);
    }
}
