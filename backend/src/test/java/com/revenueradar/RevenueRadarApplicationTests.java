package com.revenueradar;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Boots the full application context against the local PostgreSQL instance
 * and smoke-tests the unauthenticated surface.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RevenueRadarApplicationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate rest;

    @Test
    @DisplayName("Application context loads")
    void contextLoads() {
        assertThat(rest).isNotNull();
    }

    @Test
    @DisplayName("Actuator health is UP")
    void healthIsUp() {
        ResponseEntity<Map> response = rest.getForEntity(url("/actuator/health"), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("status", "UP");
    }

    @Test
    @DisplayName("Meta version endpoint returns the standard envelope")
    void metaVersion() {
        ResponseEntity<Map> response = rest.getForEntity(url("/api/v1/meta/version"), Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("success", true);

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
        assertThat(data).containsEntry("name", "RevenueRadar AI");
        assertThat(data).containsKey("version");
        assertThat(data).containsKey("env");
    }

    @Test
    @DisplayName("Security headers and request id are applied")
    void securityHeadersPresent() {
        ResponseEntity<String> response = rest.getForEntity(url("/api/v1/meta/version"), String.class);

        assertThat(response.getHeaders().containsKey("X-Content-Type-Options")).isTrue();
        assertThat(response.getHeaders().containsKey("X-Frame-Options")).isTrue();
        assertThat(response.getHeaders().containsKey("X-Request-Id")).isTrue();
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
