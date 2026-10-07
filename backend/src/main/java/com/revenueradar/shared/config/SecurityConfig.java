package com.revenueradar.shared.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revenueradar.shared.api.ApiErrorResponse;
import com.revenueradar.shared.exception.ErrorCode;
import com.revenueradar.shared.security.AuthRateLimitFilter;
import com.revenueradar.shared.security.JwtAuthenticationFilter;
import com.revenueradar.shared.security.JwtService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

import java.nio.charset.StandardCharsets;

/**
 * Stateless JWT security. Public surface: health, swagger, meta and the auth
 * endpoints themselves — everything else requires a valid access token.
 * The PATCH on /organizations is deliberately permitted at the chain level and
 * identity-checked in the controller (404 on missing or foreign tenant).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtService jwtService,
                                                   ObjectMapper objectMapper) throws Exception {
        http
                // REST API is stateless — CSRF token flow does not apply
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/health/**",
                                "/actuator/info",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api/v1/meta/**",
                                "/error").permitAll()
                        .requestMatchers(
                                "/api/v1/auth/register",
                                "/api/v1/auth/login",
                                "/api/v1/auth/refresh",
                                "/api/v1/auth/logout").permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/organizations/**").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint((request, response, authException) ->
                                writeEnvelope(objectMapper, response, HttpStatus.UNAUTHORIZED,
                                        ErrorCode.UNAUTHORIZED.name(),
                                        ErrorCode.UNAUTHORIZED.defaultMessage()))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                writeEnvelope(objectMapper, response, HttpStatus.FORBIDDEN,
                                        ErrorCode.FORBIDDEN.name(),
                                        ErrorCode.FORBIDDEN.defaultMessage())))
                .addFilterBefore(new JwtAuthenticationFilter(jwtService),
                        UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(new AuthRateLimitFilter(objectMapper),
                        UsernamePasswordAuthenticationFilter.class)
                .headers(headers -> headers
                        .contentTypeOptions(Customizer.withDefaults())
                        .frameOptions(frame -> frame.deny())
                        .xssProtection(Customizer.withDefaults())
                        .referrerPolicy(referrer -> referrer
                                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .permissionsPolicy(permissions ->
                                permissions.policy("geolocation=(), microphone=(), camera=()")));

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    /** Security filter exceptions never reach @RestControllerAdvice — write the envelope here. */
    private static void writeEnvelope(ObjectMapper objectMapper,
                                      HttpServletResponse response,
                                      HttpStatus status,
                                      String errorCode,
                                      String message) throws java.io.IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write(objectMapper.writeValueAsString(
                ApiErrorResponse.of(errorCode, message)));
    }
}
