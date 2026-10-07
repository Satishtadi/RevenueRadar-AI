package com.revenueradar;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Full Phase 3 auth lifecycle against the local PostgreSQL instance:
 * register → me → login → refresh rotation → reuse revocation → logout.
 * <p>
 * Uses the JDK HttpClient instead of TestRestTemplate: RestTemplate's
 * HttpURLConnection throws "cannot retry due to server authentication, in
 * streaming mode" for any 401 response to a request that carries a body.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AuthFlowTest {

    private static final String PASSWORD = "Sup3rSecret!pass";

    @LocalServerPort
    private int port;

    @Autowired
    private ObjectMapper mapper;

    private final HttpClient http = HttpClient.newHttpClient();

    record Result(int status, Map<String, Object> body) {
    }

    @Test
    @DisplayName("Register, me, login, refresh rotation and reuse revocation")
    void fullAuthLifecycle() {
        String email = "authflow-" + UUID.randomUUID() + "@example.com";

        // --- register -------------------------------------------------------
        Result registered = post("/api/v1/auth/register", Map.of(
                "fullName", "Auth Flow",
                "email", email,
                "password", PASSWORD,
                "orgName", "Auth Flow Clinic"), null);

        assertThat(registered.status()).isEqualTo(200);
        Map<String, Object> session = data(registered);
        assertThat((String) session.get("accessToken")).isNotBlank();
        assertThat((String) session.get("refreshToken")).isNotBlank();
        assertThat(registered.body().toString()).doesNotContain(PASSWORD);

        @SuppressWarnings("unchecked")
        Map<String, Object> user = (Map<String, Object>) session.get("user");
        assertThat(user.get("email")).isEqualTo(email);
        @SuppressWarnings("unchecked")
        List<Object> roles = (List<Object>) user.get("roles");
        assertThat(roles).containsExactly("OWNER");

        @SuppressWarnings("unchecked")
        Map<String, Object> org = (Map<String, Object>) session.get("organization");
        assertThat(org.get("onboarded")).isEqualTo(false);
        assertThat(org.get("name")).isEqualTo("Auth Flow Clinic");

        // duplicate email -> 409 EMAIL_ALREADY_EXISTS
        Result duplicate = post("/api/v1/auth/register", Map.of(
                "fullName", "Auth Flow",
                "email", email,
                "password", PASSWORD,
                "orgName", "Auth Flow Clinic"), null);
        assertThat(duplicate.status()).isEqualTo(409);
        assertThat(duplicate.body().get("errorCode")).isEqualTo("EMAIL_ALREADY_EXISTS");

        // --- me -------------------------------------------------------------
        Result anonymousMe = get("/api/v1/auth/me", null);
        assertThat(anonymousMe.status()).isEqualTo(401);
        assertThat(anonymousMe.body().get("errorCode")).isEqualTo("UNAUTHORIZED");

        String accessToken = (String) session.get("accessToken");
        Result me = get("/api/v1/auth/me", accessToken);
        assertThat(me.status()).isEqualTo(200);
        assertThat(data(me).get("email")).isEqualTo(email);

        // --- login ----------------------------------------------------------
        Result goodLogin = post("/api/v1/auth/login",
                Map.of("email", email, "password", PASSWORD), null);
        assertThat(goodLogin.status()).isEqualTo(200);
        assertThat(data(goodLogin).get("accessToken")).isNotNull();

        Result badLogin = post("/api/v1/auth/login",
                Map.of("email", email, "password", "wrong-password"), null);
        assertThat(badLogin.status()).isEqualTo(401);
        assertThat(badLogin.body().get("errorCode")).isEqualTo("INVALID_CREDENTIALS");

        // --- refresh rotation + reuse detection -----------------------------
        String refresh1 = (String) session.get("refreshToken");
        Result rotated = post("/api/v1/auth/refresh", Map.of("refreshToken", refresh1), null);
        assertThat(rotated.status()).isEqualTo(200);
        String refresh2 = (String) data(rotated).get("refreshToken");
        assertThat(refresh2).isNotBlank().isNotEqualTo(refresh1);

        // reuse of the already-rotated token revokes the family
        Result reused = post("/api/v1/auth/refresh", Map.of("refreshToken", refresh1), null);
        assertThat(reused.status()).isEqualTo(401);

        // ... and the family's newest token is dead too
        Result familyDead = post("/api/v1/auth/refresh", Map.of("refreshToken", refresh2), null);
        assertThat(familyDead.status()).isEqualTo(401);

        // unknown token -> 401
        Result garbage = post("/api/v1/auth/refresh",
                Map.of("refreshToken", "not-a-real-token"), null);
        assertThat(garbage.status()).isEqualTo(401);
    }

    @Test
    @DisplayName("Logout revokes the refresh token family")
    void logoutRevokesFamily() {
        String email = "logout-" + UUID.randomUUID() + "@example.com";
        Result registered = post("/api/v1/auth/register", Map.of(
                "fullName", "Logout User",
                "email", email,
                "password", PASSWORD,
                "orgName", "Logout Clinic"), null);
        assertThat(registered.status()).isEqualTo(200);
        String refreshToken = (String) data(registered).get("refreshToken");

        Result loggedOut = post("/api/v1/auth/logout", Map.of("refreshToken", refreshToken), null);
        assertThat(loggedOut.status()).isEqualTo(200);

        Result refreshAfterLogout = post("/api/v1/auth/refresh",
                Map.of("refreshToken", refreshToken), null);
        assertThat(refreshAfterLogout.status()).isEqualTo(401);
    }

    @Test
    @DisplayName("Validation errors return 400 VALIDATION_ERROR")
    void validationErrors() {
        Result weakPassword = post("/api/v1/auth/register", Map.of(
                "fullName", "Weak",
                "email", "weak-" + UUID.randomUUID() + "@example.com",
                "password", "short",
                "orgName", "Weak Clinic"), null);
        assertThat(weakPassword.status()).isEqualTo(400);
        assertThat(weakPassword.body().get("errorCode")).isEqualTo("VALIDATION_ERROR");
    }

    // --- helpers -----------------------------------------------------------

    private Result post(String path, Map<String, Object> payload, String bearer) {
        return send("POST", path, payload, bearer);
    }

    private Result get(String path, String bearer) {
        return send("GET", path, null, bearer);
    }

    private Result send(String method, String path, Map<String, Object> payload, String bearer) {
        try {
            HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(url(path)))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json");
            if (bearer != null) {
                builder.header("Authorization", "Bearer " + bearer);
            }
            if ("GET".equals(method)) {
                builder.GET();
            } else {
                builder.method(method, HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(payload)));
            }
            HttpResponse<String> response = http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            Map<String, Object> body = response.body() == null || response.body().isBlank()
                    ? Map.of()
                    : mapper.readValue(response.body(), Map.class);
            return new Result(response.statusCode(), body);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(method + " " + path + " interrupted", e);
        } catch (Exception e) {
            throw new IllegalStateException(method + " " + path + " failed: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> data(Result result) {
        return (Map<String, Object>) result.body().get("data");
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
