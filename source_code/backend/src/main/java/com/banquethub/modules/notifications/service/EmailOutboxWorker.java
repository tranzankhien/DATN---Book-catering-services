package com.banquethub.modules.notifications.service;

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
    private final EmailOutboxService outbox;
    private final JavaMailSender sender;
    private final String from;
    public EmailOutboxWorker(EmailOutboxService outbox,JavaMailSender sender,@Value("${app.email.from:noreply@banquethub.local}") String from) {
        this.outbox=outbox; this.sender=sender; this.from=from;
    }
    @Scheduled(fixedDelayString="${app.email.poll-delay-ms:5000}")
    @Transactional(propagation=Propagation.NOT_SUPPORTED)
    public void tick() {
        // One claim per tick bounds work; each claim commits before SMTP starts.
        outbox.claim().ifPresent(claim -> {
            try {
                var message=sender.createMimeMessage();
                var helper=new MimeMessageHelper(message,"UTF-8");
                helper.setFrom(from); helper.setTo(claim.recipient()); helper.setSubject(claim.subject());
                helper.setText(claim.html(),true);
                sender.send(message);
            } catch(Exception ex) { outbox.failed(claim); return; }
            outbox.sent(claim);
        });
    }
}
