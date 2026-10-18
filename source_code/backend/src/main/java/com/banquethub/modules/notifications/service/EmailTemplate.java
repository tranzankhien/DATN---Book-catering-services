package com.banquethub.modules.notifications.service;

import com.banquethub.modules.orders.entity.Order;
import org.springframework.web.util.HtmlUtils;
import java.text.NumberFormat;
import java.util.Locale;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.OffsetDateTime;

public final class EmailTemplate {
    private EmailTemplate() {}
    public static String title(String event) {
        return switch(event) {
            case "PAYMENT_CONFIRMED" -> "Xác nhận đặt tiệc thành công";
            case "ORDER_PREPARING" -> "Đơn tiệc đang được chuẩn bị";
            case "ORDER_COMPLETED" -> "Đơn tiệc đã hoàn thành";
            default -> throw new IllegalArgumentException("Unsupported email event");
        };
    }
    private static String esc(Object value) { return HtmlUtils.htmlEscape(value == null ? "" : value.toString()); }
    private static String time(OffsetDateTime value) {
        return value == null ? "" : value.atZoneSameInstant(ZoneId.of("Asia/Ho_Chi_Minh"))
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
    }
    static String validateWebsiteUrl(String websiteUrl) {
        var uri = java.net.URI.create(websiteUrl);
        if (!("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme())) || uri.getHost() == null
                || uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null)
            throw new IllegalArgumentException("Website URL must be an absolute HTTP(S) URL");
        return websiteUrl.replaceAll("/+$", "");
    }

    public static String render(Order order, String event, String websiteUrl) {
        StringBuilder html = new StringBuilder("<!doctype html><html lang=\"vi\"><body style=\"font-family:Arial,sans-serif;color:#24352a\"><h1>BanquetHub</h1><h2>")
                .append(title(event)).append("</h2><p>Xin chào ").append(esc(order.getCustomerName())).append(",</p><p>")
                .append(event.equals("PAYMENT_CONFIRMED") ? "Đơn đặt tiệc của bạn đã được thanh toán thành công." : title(event) + ".")
                .append("</p><p>Mã đơn: ").append(esc(order.getOrderCode()))
                .append("<br>Ngày đặt: ").append(time(order.getCreatedAt()))
                .append("<br>Ngày tổ chức: ").append(time(order.getEventDateTime()))
                .append("<br>Số bàn: ").append(order.getTableCount())
                .append("</p><table cellpadding=\"8\" border=\"1\" style=\"border-collapse:collapse\"><tr><th>Món ăn</th><th>Số lượng</th></tr>");
        order.getItems().forEach(item -> html.append("<tr><td>").append(esc(item.getDishNameSnapshot()))
                .append("</td><td>").append(item.getTotalQuantity()).append("</td></tr>"));
        return html.append("</table><p>Tổng tiền: ").append(NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN")).format(order.getTotalAmount()))
                .append("<br>Phương thức: SePay<br>Thanh toán: Đã thanh toán</p><p><a href=\"")
                .append(esc(websiteUrl + "/my-orders/" + order.getId()))
                .append("\">Xem chi tiết đơn hàng</a></p><p>Cảm ơn bạn đã lựa chọn BanquetHub!</p></body></html>").toString();
    }
}
