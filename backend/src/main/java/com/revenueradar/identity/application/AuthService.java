package com.revenueradar.identity.application;

import com.revenueradar.identity.api.AuthDtos.LoginRequest;
import com.revenueradar.identity.api.AuthDtos.OrganizationView;
import com.revenueradar.identity.api.AuthDtos.RegisterRequest;
import com.revenueradar.identity.api.AuthDtos.SessionView;
import com.revenueradar.identity.api.AuthDtos.UserView;
import com.revenueradar.identity.domain.RefreshToken;
import com.revenueradar.identity.domain.User;
import com.revenueradar.identity.infra.RefreshTokenRepository;
import com.revenueradar.identity.infra.UserRepository;
import com.revenueradar.organization.domain.Organization;
import com.revenueradar.organization.infra.OrganizationRepository;
import com.revenueradar.shared.exception.EmailAlreadyExistsException;
import com.revenueradar.shared.exception.ResourceNotFoundException;
import com.revenueradar.shared.exception.UnauthorizedException;
import com.revenueradar.shared.security.AuthenticatedUser;
import com.revenueradar.shared.security.JwtService;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Phase 3 authentication: register (org + owner), login, refresh rotation with
 * reuse detection, logout and current-user lookup.
 * Refresh tokens are opaque, stored only as SHA-256 hashes, 14-day TTL.
 */
@Service
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Duration REFRESH_TTL = Duration.ofDays(14);

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       OrganizationRepository organizationRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public SessionView register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException();
        }

        Organization organization = new Organization();
        organization.setName(request.orgName().trim());
        organization.setCurrency("INR");
        organization.setTimezone("Asia/Kolkata");
        organization.setOnboarded(false);
        organization = organizationRepository.save(organization);

        User user = new User();
        user.setOrganizationId(organization.getId());
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRoles(User.ROLE_OWNER);
        user.setStatus(User.STATUS_ACTIVE);
        user = userRepository.save(user);

        return session(user, organization);
    }

    @Transactional
    public SessionView login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        if (!User.STATUS_ACTIVE.equals(user.getStatus())) {
            throw new DisabledException("Account is disabled");
        }
        user.setLastLoginAt(Instant.now());
        Organization organization = organizationRepository.findById(user.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        return session(user, organization);
    }

    /**
     * Rotates the refresh token. Presenting an already-rotated (revoked) token means
     * the family may be stolen — the whole family is revoked and the caller must sign in again.
     * The revocation must survive the thrown 401, hence noRollbackFor.
     */
    @Transactional(noRollbackFor = UnauthorizedException.class)
    public SessionView refresh(String rawToken) {
        RefreshToken stored = findValidToken(rawToken);
        if (stored.getRevokedAt() != null) {
            revokeFamily(stored.getFamilyId());
            throw new UnauthorizedException("Refresh token has been revoked. Please sign in again.");
        }

        stored.setRevokedAt(Instant.now());

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> new UnauthorizedException("Account no longer exists"));
        if (!User.STATUS_ACTIVE.equals(user.getStatus())) {
            throw new UnauthorizedException("Account is disabled");
        }
        Organization organization = organizationRepository.findById(user.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        String nextToken = issueRefreshToken(user.getId(), stored.getFamilyId());
        return new SessionView(
                jwtService.generateAccessToken(principal(user)),
                nextToken,
                userView(user),
                organizationView(organization)
        );
    }

    @Transactional
    public void logout(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHash(sha256Hex(rawToken.trim()))
                .ifPresent(token -> revokeFamily(token.getFamilyId()));
    }

    @Transactional(readOnly = true)
    public UserView me(AuthenticatedUser principal) {
        User user = userRepository.findById(principal.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return userView(user);
    }

    private SessionView session(User user, Organization organization) {
        String refreshToken = issueRefreshToken(user.getId(), null);
        return new SessionView(
                jwtService.generateAccessToken(principal(user)),
                refreshToken,
                userView(user),
                organizationView(organization)
        );
    }

    private RefreshToken findValidToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new UnauthorizedException("Refresh token is required");
        }
        RefreshToken stored = refreshTokenRepository.findByTokenHash(sha256Hex(rawToken.trim()))
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            stored.setRevokedAt(Instant.now());
            throw new UnauthorizedException("Refresh token expired");
        }
        return stored;
    }

    private String issueRefreshToken(UUID userId, UUID familyId) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        RefreshToken token = new RefreshToken();
        token.setUserId(userId);
        token.setTokenHash(sha256Hex(raw));
        token.setFamilyId(familyId != null ? familyId : UUID.randomUUID());
        token.setExpiresAt(Instant.now().plus(REFRESH_TTL));
        refreshTokenRepository.save(token);
        return raw;
    }

    private void revokeFamily(UUID familyId) {
        refreshTokenRepository.findByFamilyId(familyId).forEach(token -> {
            if (token.getRevokedAt() == null) {
                token.setRevokedAt(Instant.now());
            }
        });
    }

    private static AuthenticatedUser principal(User user) {
        List<String> roles = List.of(user.getRoles().split(","));
        return new AuthenticatedUser(
                user.getId(),
                user.getOrganizationId(),
                user.getEmail(),
                roles.stream().map(String::trim).filter(r -> !r.isEmpty()).toList()
        );
    }

    private static UserView userView(User user) {
        List<String> roles = principal(user).roles();
        return new UserView(
                user.getId().toString(),
                user.getFullName(),
                user.getEmail(),
                roles,
                user.getOrganizationId().toString()
        );
    }

    private static OrganizationView organizationView(Organization organization) {
        return new OrganizationView(
                organization.getId().toString(),
                organization.getName(),
                organization.getBusinessType(),
                organization.getCurrency(),
                organization.getTimezone(),
                organization.isOnboarded()
        );
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String sha256Hex(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
