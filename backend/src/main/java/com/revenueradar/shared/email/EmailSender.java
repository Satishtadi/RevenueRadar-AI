package com.revenueradar.shared.email;

/**
 * Outbound email abstraction. MVP ships a no-op implementation that logs the
 * link (dev-friendly); a real provider (SMTP/SendGrid) plugs in during
 * production hardening without touching the auth flow.
 */
public interface EmailSender {

    void sendPasswordReset(String toEmail, String resetUrl);
}
