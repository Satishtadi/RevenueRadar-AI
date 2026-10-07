package com.revenueradar.shared.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * No-op email delivery: the reset link is written to the application log so the
 * flow is fully exercisable before a real email provider exists.
 * Keeps the last reset URL in memory so tests can complete the flow.
 */
@Component
public class NoopEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(NoopEmailSender.class);

    private volatile String lastRecipient;
    private volatile String lastResetUrl;

    @Override
    public void sendPasswordReset(String toEmail, String resetUrl) {
        this.lastRecipient = toEmail;
        this.lastResetUrl = resetUrl;
        log.info("NoopEmailSender: password reset link for {} -> {}", toEmail, resetUrl);
    }

    public String getLastRecipient() {
        return lastRecipient;
    }

    public String getLastResetUrl() {
        return lastResetUrl;
    }
}
