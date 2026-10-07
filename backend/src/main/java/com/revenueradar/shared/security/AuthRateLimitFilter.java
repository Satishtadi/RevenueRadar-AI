package com.revenueradar.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revenueradar.shared.api.ApiErrorResponse;
import com.revenueradar.shared.exception.ErrorCode;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Fixed-window rate limiter for the public auth endpoints
 * (login/register/refresh/forgot-password/reset-password).
 * In-memory per instance — appropriate for the single-instance free tier.
 * Runs inside the security chain, writes the standard error envelope directly.
 */
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000L;
    private static final int MAX_REQUESTS = 20;

    private final ObjectMapper objectMapper;
    private final Map<String, Window> hits = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    record Window(long startedAt, AtomicInteger count) {
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (isRateLimited(request)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiErrorResponse.of(ErrorCode.RATE_LIMITED.name(),
                            "Too many attempts. Please wait a minute and try again.")));
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean isRateLimited(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (!(path.endsWith("/auth/login") || path.endsWith("/auth/register")
                || path.endsWith("/auth/refresh") || path.endsWith("/auth/forgot-password")
                || path.endsWith("/auth/reset-password"))) {
            return false;
        }
        long now = System.currentTimeMillis();
        String key = clientIp(request) + '|' + path;
        if (hits.size() > 10_000) {
            hits.clear();
        }
        Window window = hits.compute(key,
                (k, w) -> (w == null || now - w.startedAt() > WINDOW_MS)
                        ? new Window(now, new AtomicInteger(1))
                        : w);
        if (now - window.startedAt() > WINDOW_MS) {
            return false;
        }
        return window.count().incrementAndGet() > MAX_REQUESTS;
    }

    private static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            return (comma > 0 ? forwarded.substring(0, comma) : forwarded).trim();
        }
        String ip = request.getRemoteAddr();
        return ip != null ? ip : "unknown";
    }
}
