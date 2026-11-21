package com.banquethub.modules.notifications.service;

import com.banquethub.modules.orders.entity.Order;
import org.springframework.web.util.HtmlUtils;

import java.text.NumberFormat;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public final class EmailTemplate {
    private EmailTemplate() {}

    public static String title(String event) {
        return switch (event) {
            case "PAYMENT_CONFIRMED" -> "Xác nhận đặt tiệc & Hóa đơn điện tử";
            case "ORDER_PREPARING" -> "Đơn tiệc đang được chuẩn bị";
            case "ORDER_COMPLETED" -> "Đơn tiệc đã hoàn thành mỹ mãn";
            default -> throw new IllegalArgumentException("Unsupported email event: " + event);
        };
    }

    private static String esc(Object value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value.toString());
    }

    private static String time(OffsetDateTime value) {
        return value == null ? "—" : value.atZoneSameInstant(ZoneId.of("Asia/Ho_Chi_Minh"))
                .format(DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy"));
    }

    static String validateWebsiteUrl(String websiteUrl) {
        var uri = java.net.URI.create(websiteUrl);
        if (!("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme())) || uri.getHost() == null
                || uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null)
            throw new IllegalArgumentException("Website URL must be an absolute HTTP(S) URL");
        return websiteUrl.replaceAll("/+$", "");
    }

    public static String render(Order order, String event, String websiteUrl) {
        NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN"));
        String formattedTotal = currencyFormat.format(order.getTotalAmount());
        String eventTitle = title(event);

        String badgeHtml = switch (event) {
            case "PAYMENT_CONFIRMED" -> """
                <span style="display: inline-block; background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 6px 16px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                    &#10003; Đã thanh toán thành công qua SePay
                </span>
                """;
            case "ORDER_PREPARING" -> """
                <span style="display: inline-block; background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 6px 16px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                    &#9203; Bếp trưởng đang chuẩn bị món tiệc
                </span>
                """;
            case "ORDER_COMPLETED" -> """
                <span style="display: inline-block; background-color: #f5f3ff; color: #5b21b6; border: 1px solid #ddd6fe; padding: 6px 16px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
                    &#9733; Đơn tiệc đã hoàn thành mỹ mãn
                </span>
                """;
            default -> "";
        };

        String eventDesc = switch (event) {
            case "PAYMENT_CONFIRMED" -> "Đơn đặt tiệc của quý khách đã được bảo đảm thành công. Hệ thống đã khóa nguồn nguyên liệu tươi ngon nhất và chuyển giao thông tin trực tiếp tới đội ngũ bếp trưởng điều phối sự kiện.";
            case "ORDER_PREPARING" -> "Đội ngũ bếp trưởng tại sảnh tiệc đang bắt tay vào chuẩn bị nguyên vật liệu và quy trình chế biến tiêu chuẩn cho buổi tiệc của bạn.";
            case "ORDER_COMPLETED" -> "BanquetHub trân trọng cảm ơn quý khách đã tin tưởng lựa chọn dịch vụ yến tiệc của chúng tôi. Chúc quý khách và gia đình, đối tác có những trải nghiệm ẩm thực trọn vẹn nhất.";
            default -> "";
        };

        StringBuilder dishRows = new StringBuilder();
        int dishCount = order.getItems() != null ? order.getItems().size() : 0;
        if (order.getItems() != null) {
            for (int i = 0; i < order.getItems().size(); i++) {
                var item = order.getItems().get(i);
                String bg = (i % 2 == 0) ? "#ffffff" : "#fafaf9";
                dishRows.append("""
                    <tr style="background-color: %s; border-bottom: 1px solid #f5f5f4;">
                        <td style="padding: 12px 16px; font-size: 13px; color: #1c1917; font-weight: 600;">
                            %s
                        </td>
                        <td align="center" style="padding: 12px 16px; font-size: 12px; color: #78716c; font-weight: 500;">
                            %d phần/bàn
                        </td>
                        <td align="right" style="padding: 12px 16px; font-size: 13px; color: #b45309; font-weight: 700;">
                            x%d
                        </td>
                    </tr>
                """.formatted(
                    bg,
                    esc(item.getDishNameSnapshot()),
                    item.getQuantityPerTable(),
                    item.getTotalQuantity()
                ));
            }
        }

        String contactPersonRow = "";
        if (order.getContactName() != null && !order.getContactName().isBlank()) {
            contactPersonRow = """
                <tr>
                    <td style="color: #78716c; padding: 6px 0; font-size: 13px;">Người đón tiếp tại sảnh:</td>
                    <td style="font-weight: 600; color: #1c1917; padding: 6px 0; font-size: 13px;">%s %s</td>
                </tr>
            """.formatted(
                esc(order.getContactName()),
                order.getContactPhone() != null ? "(SĐT: " + esc(order.getContactPhone()) + ")" : ""
            );
        }

        String noteRow = "";
        if (order.getNote() != null && !order.getNote().isBlank()) {
            noteRow = """
                <tr>
                    <td style="color: #78716c; padding: 6px 0; font-size: 13px; vertical-align: top;">Ghi chú yêu cầu:</td>
                    <td style="font-style: italic; color: #57534e; padding: 6px 0; font-size: 13px;">&ldquo;%s&rdquo;</td>
                </tr>
            """.formatted(esc(order.getNote()));
        }

        int guestEstimate = order.getGuestCount() != null && order.getGuestCount() > 0
                ? order.getGuestCount()
                : order.getTableCount() * 10;

        String detailUrl = esc(websiteUrl + "/my-orders/" + order.getId());

        return """
            <!doctype html>
            <html lang="vi">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>%s</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #fafaf9; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1c1917; -webkit-font-smoothing: antialiased;">
                <!-- Preheader snippet -->
                <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0;">
                    [BanquetHub] %s - Hợp đồng đơn tiệc #%s của quý khách %s.
                </div>

                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color: #fafaf9; padding: 40px 12px;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; box-shadow: 0 10px 25px -5px rgba(28, 25, 23, 0.05), 0 8px 10px -6px rgba(28, 25, 23, 0.02);">
                                
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

                                <!-- Hero Section -->
                                <tr>
                                    <td style="padding: 28px 36px 0 36px; text-align: center;">
                                        <div style="margin-bottom: 14px;">
                                            %s
                                        </div>
                                        <h1 style="font-size: 22px; font-weight: 800; color: #1c1917; margin: 0 0 10px 0; letter-spacing: -0.5px;">
                                            %s
                                        </h1>
                                        <p style="font-size: 13.5px; color: #57534e; line-height: 1.6; margin: 0 0 24px 0;">
                                            Kính chào <strong>%s</strong>, %s
                                        </p>
                                    </td>
                                </tr>

                                <!-- Event Details Card -->
                                <tr>
                                    <td style="padding: 0 36px;">
                                        <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                                            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #b45309; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #e7e5e4; padding-bottom: 8px;">
                                                Thông tin sự kiện &amp; Địa điểm tổ chức
                                            </div>
                                            <table width="100%%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #1c1917;">
                                                <tr>
                                                    <td width="38%%" style="color: #78716c; padding: 6px 0;">Mã hợp đồng / Đơn:</td>
                                                    <td style="font-weight: 700; color: #b45309; font-size: 13.5px; padding: 6px 0;">#%s</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #78716c; padding: 6px 0;">Khách hàng đặt tiệc:</td>
                                                    <td style="font-weight: 600; color: #1c1917; padding: 6px 0;">%s &bull; %s</td>
                                                </tr>
                                                %s
                                                <tr>
                                                    <td style="color: #78716c; padding: 6px 0;">Thời gian đón khách:</td>
                                                    <td style="font-weight: 600; color: #1c1917; padding: 6px 0;">%s</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #78716c; padding: 6px 0;">Quy mô tiệc:</td>
                                                    <td style="font-weight: 600; color: #1c1917; padding: 6px 0;">%d bàn (~%d khách)</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #78716c; padding: 6px 0; vertical-align: top;">Địa điểm sảnh tiệc:</td>
                                                    <td style="font-weight: 600; color: #1c1917; padding: 6px 0; line-height: 1.5;">%s</td>
                                                </tr>
                                                %s
                                            </table>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Menu Items Table -->
                                <tr>
                                    <td style="padding: 0 36px;">
                                        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #b45309; letter-spacing: 1px; margin-bottom: 10px;">
                                            Thực đơn yến tiệc đã chọn (%d món)
                                        </div>
                                        <table width="100%%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #e7e5e4; border-radius: 10px; overflow: hidden; margin-bottom: 24px;">
                                            <tr style="background-color: #f5f5f4; color: #78716c; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                                                <th align="left" style="padding: 10px 16px; border-bottom: 1px solid #e7e5e4;">Món ăn</th>
                                                <th align="center" width="28%%" style="padding: 10px 16px; border-bottom: 1px solid #e7e5e4;">Định lượng</th>
                                                <th align="right" width="22%%" style="padding: 10px 16px; border-bottom: 1px solid #e7e5e4;">Tổng phần</th>
                                            </tr>
                                            %s
                                        </table>
                                    </td>
                                </tr>

                                <!-- Payment Settlement Box -->
                                <tr>
                                    <td style="padding: 0 36px 28px 36px;">
                                        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 18px 20px;">
                                            <table width="100%%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
                                                <tr>
                                                    <td style="color: #92400e; font-weight: 600;">Tổng giá trị hợp đồng:</td>
                                                    <td align="right" style="font-size: 20px; font-weight: 800; color: #b45309;">%s</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #78716c; font-size: 12px; padding-top: 8px;">Phương thức thanh toán:</td>
                                                    <td align="right" style="color: #065f46; font-weight: 700; font-size: 12.5px; padding-top: 8px;">Cổng thanh toán SePay (Tất toán 100%%)</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #78716c; font-size: 12px; padding-top: 4px;">Trạng thái kho nguyên liệu:</td>
                                                    <td align="right" style="color: #065f46; font-weight: 600; font-size: 12px; padding-top: 4px;">Đã khóa giữ chỗ &amp; bảo đảm phục vụ</td>
                                                </tr>
                                            </table>
                                        </div>

                                        <!-- Primary CTA Button -->
                                        <div style="text-align: center; margin-top: 28px;">
                                            <a href="%s" target="_blank" style="background-color: #b45309; background: linear-gradient(135deg, #b45309 0%%, #92400e 100%%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 13.5px; display: inline-block; box-shadow: 0 4px 12px rgba(180, 83, 9, 0.25); letter-spacing: 0.2px;">
                                                Xem chi tiết đơn tiệc tại BanquetHub &rarr;
                                            </a>
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
            """.formatted(
                eventTitle,
                eventTitle,
                esc(order.getOrderCode()),
                esc(order.getCustomerName()),
                badgeHtml,
                eventTitle,
                esc(order.getCustomerName()),
                eventDesc,
                esc(order.getOrderCode()),
                esc(order.getCustomerName()),
                esc(order.getCustomerPhone()),
                contactPersonRow,
                time(order.getEventDateTime()),
                order.getTableCount(),
                guestEstimate,
                esc(order.getEventLocation() != null ? order.getEventLocation() : "Chưa cung cấp"),
                noteRow,
                dishCount,
                dishRows.toString(),
                formattedTotal,
                detailUrl
            );
    }
}
