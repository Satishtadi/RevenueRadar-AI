package com.revenueradar.identity.api;

import com.revenueradar.identity.api.AuthDtos.LoginRequest;
import com.revenueradar.identity.api.AuthDtos.RefreshRequest;
import com.revenueradar.identity.api.AuthDtos.RegisterRequest;
import com.revenueradar.identity.api.AuthDtos.SessionView;
import com.revenueradar.identity.api.AuthDtos.UserView;
import com.revenueradar.identity.application.AuthService;
import com.revenueradar.shared.api.ApiResponse;
import com.revenueradar.shared.exception.UnauthorizedException;
import com.revenueradar.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${app.api-base-path}/auth")
@Tag(name = "Auth", description = "Registration, login, token refresh and current user")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Create organization + owner account and start a session")
    public ApiResponse<SessionView> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Sign in with email and password")
    public ApiResponse<SessionView> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate the refresh token and issue a new access token")
    public ApiResponse<SessionView> refresh(@Valid @RequestBody RefreshRequest request) {
        return ApiResponse.ok(authService.refresh(request.refreshToken()));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke the presented refresh token family")
    public ApiResponse<Void> logout(@RequestBody(required = false) RefreshRequest request) {
        authService.logout(request != null ? request.refreshToken() : null);
        return ApiResponse.message("Signed out");
    }

    @GetMapping("/me")
    @Operation(summary = "Current authenticated user")
    public ApiResponse<UserView> me(@AuthenticationPrincipal AuthenticatedUser principal) {
        if (principal == null) {
            throw new UnauthorizedException();
        }
        return ApiResponse.ok(authService.me(principal));
    }
}
