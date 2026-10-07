package com.revenueradar.shared.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Authenticated principal carried by the security context after JWT validation.
 * Built purely from signed token claims — no database hit per request.
 */
public record AuthenticatedUser(
        UUID userId,
        UUID organizationId,
        String email,
        List<String> roles
) implements Serializable {

    public Collection<GrantedAuthority> authorities() {
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toUnmodifiableList());
    }
}
