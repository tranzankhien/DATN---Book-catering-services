package com.banquethub.modules.notifications.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name="app.email.worker-enabled",havingValue="true")
public class EmailOutboxWorker {
    private static final Logger log = LoggerFactory.getLogger(EmailOutboxWorker.class);
    private final EmailOutboxService outbox;
    private final JavaMailSender sender;
    private final String from;

    public EmailOutboxWorker(EmailOutboxService outbox, JavaMailSender sender, @Value("${app.email.from:noreply@banquethub.local}") String from) {
        this.outbox = outbox;
        this.sender = sender;
        this.from = from;
        log.info("EmailOutboxWorker đã khởi động thành công với địa chỉ gửi [{}]", from);
    }

    @Scheduled(fixedDelayString="${app.email.poll-delay-ms:5000}")
    @Transactional(propagation=Propagation.NOT_SUPPORTED)
    public void tick() {
        outbox.claim().ifPresent(claim -> {
            log.info("EmailOutboxWorker đang gửi email tới [{}] với tiêu đề [{}]", claim.recipient(), claim.subject());
            try {
                var message = sender.createMimeMessage();
                var helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(from, "BanquetHub - Ẩm Thực Yến Tiệc");
                helper.setTo(claim.recipient());
                helper.setSubject(claim.subject());
                helper.setText(claim.html(), true);
                sender.send(message);
                outbox.sent(claim);
                log.info("EmailOutboxWorker đã gửi email đơn hàng thành công tới [{}]", claim.recipient());
            } catch (Exception ex) {
                log.error("EmailOutboxWorker gửi thất bại tới [{}]: {}", claim.recipient(), ex.getMessage());
                outbox.failed(claim);
            }
        });
    }
}
