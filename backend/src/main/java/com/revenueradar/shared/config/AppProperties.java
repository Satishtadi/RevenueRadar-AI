package com.revenueradar.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Application-level configuration bound from the `app.*` namespace.
 * Secrets are always injected from environment variables, never hard-coded.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String env,
        String apiBasePath,
        Cors cors,
        Security security,
        Ai ai,
        Pagination pagination
) {
    /**
     * CORS allow-list. Never "*" combined with credentials in any environment.
     */
    public record Cors(List<String> allowedOrigins) {
    }

    public record Security(Jwt jwt) {
    }

    public record Jwt(String secret, long accessTokenMinutes, long refreshTokenDays) {
    }

    public record Ai(String provider) {
    }

    public record Pagination(int defaultPageSize, int maxPageSize) {
    }
}
