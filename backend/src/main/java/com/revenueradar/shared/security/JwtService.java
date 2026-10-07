package com.revenueradar.shared.security;

import com.revenueradar.shared.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Issues and validates HS256 access tokens (15 min by default).
 * The signing key is SHA-256(user-configured secret) so any secret length is safe.
 */
@Component
public class JwtService {

    private static final String CLAIM_TYPE = "typ";
    private static final String CLAIM_ORG = "org";
    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_ROLES = "roles";
    private static final String TYPE_ACCESS = "access";

    private final SecretKey key;
    private final Duration accessTtl;

    public JwtService(AppProperties props) {
        AppProperties.Jwt jwt = props.security().jwt();
        this.key = Keys.hmacShaKeyFor(sha256(jwt.secret()));
        this.accessTtl = Duration.ofMinutes(jwt.accessTokenMinutes());
    }

    public String generateAccessToken(AuthenticatedUser user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.userId().toString())
                .claim(CLAIM_ORG, user.organizationId().toString())
                .claim(CLAIM_EMAIL, user.email())
                .claim(CLAIM_ROLES, user.roles())
                .claim(CLAIM_TYPE, TYPE_ACCESS)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTtl)))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    /**
     * @throws JwtException when the token is malformed, expired, forged or of the wrong type
     */
    public AuthenticatedUser parseAccessToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        if (!TYPE_ACCESS.equals(claims.get(CLAIM_TYPE, String.class))) {
            throw new JwtException("Unexpected token type");
        }
        UUID userId = UUID.fromString(claims.getSubject());
        UUID orgId = UUID.fromString(claims.get(CLAIM_ORG, String.class));
        List<String> roles = claims.get(CLAIM_ROLES, List.class);
        return new AuthenticatedUser(userId, orgId, claims.get(CLAIM_EMAIL, String.class), roles);
    }

    private static byte[] sha256(String secret) {
        try {
            return MessageDigest.getInstance("SHA-256")
                    .digest(secret.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is mandatory on every JVM
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
