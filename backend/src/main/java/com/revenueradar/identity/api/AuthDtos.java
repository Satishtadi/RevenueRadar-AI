package com.revenueradar.identity.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Auth request/response contracts shared by the controller and the service.
 */
public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 120) String fullName,
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(min = 8, max = 72) String password,
            @NotBlank @Size(max = 120) String orgName
    ) {
    }

    public record LoginRequest(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(max = 72) String password
    ) {
    }

    public record RefreshRequest(
            @NotBlank @Size(max = 512) String refreshToken
    ) {
    }

    public record ForgotPasswordRequest(
            @NotBlank @Email @Size(max = 255) String email
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank @Size(max = 512) String token,
            @NotBlank @Size(min = 8, max = 72) String newPassword
    ) {
    }

    public record UserView(
            String id,
            String fullName,
            String email,
            List<String> roles,
            String organizationId
    ) {
    }

    public record OrganizationView(
            String id,
            String name,
            String businessType,
            String currency,
            String timezone,
            boolean onboarded
    ) {
    }

    public record SessionView(
            String accessToken,
            String refreshToken,
            UserView user,
            OrganizationView organization
    ) {
    }
}
