package com.revenueradar.shared.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Validates the {@code Authorization: Bearer} header and populates the security context.
 * Invalid tokens are left unauthenticated — the entry point produces the 401 envelope
 * for endpoints that require authentication.
 * <p>
 * Not a Spring bean on purpose: instantiated inside the security filter chain to avoid
 * double registration as a plain servlet filter.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.regionMatches(true, 0, BEARER, 0, BEARER.length())) {
            try {
                AuthenticatedUser user = jwtService.parseAccessToken(header.substring(BEARER.length()).trim());
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(user, null, user.authorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                MDC.put("orgId", user.organizationId().toString());
                MDC.put("userId", user.userId().toString());
            } catch (Exception ex) {
                SecurityContextHolder.clearContext();
                logger.debug("JWT validation failed: " + ex.getClass().getSimpleName());
            }
        }
        try {
            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
            MDC.remove("orgId");
            MDC.remove("userId");
        }
    }
}
