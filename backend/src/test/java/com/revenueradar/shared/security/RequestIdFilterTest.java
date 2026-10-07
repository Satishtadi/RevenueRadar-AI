package com.revenueradar.shared.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RequestIdFilterTest {

    @Test
    @DisplayName("Accepts a well-formed incoming request id")
    void acceptsValidId() {
        assertThat(RequestIdFilter.sanitize("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).isNotNull();
        assertThat(RequestIdFilter.sanitize("req_12345")).isEqualTo("req_12345");
    }

    @Test
    @DisplayName("Rejects injection attempts and oversized values")
    void rejectsHostileValues() {
        assertThat(RequestIdFilter.sanitize("abc\nInjected: true")).isNull();
        assertThat(RequestIdFilter.sanitize("<script>alert(1)</script>")).isNull();
        assertThat(RequestIdFilter.sanitize("x".repeat(65))).isNull();
        assertThat(RequestIdFilter.sanitize("   ")).isNull();
        assertThat(RequestIdFilter.sanitize(null)).isNull();
    }
}
