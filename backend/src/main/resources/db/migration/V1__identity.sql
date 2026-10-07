-- Phase 3: identity (organizations, users, refresh tokens)

CREATE TABLE organizations (
    id            UUID PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    business_type VARCHAR(60),
    currency      VARCHAR(3)   NOT NULL,
    timezone      VARCHAR(60)  NOT NULL,
    onboarded     BOOLEAN      NOT NULL,
    goals         VARCHAR(500),
    created_at    TIMESTAMPTZ  NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL
);

CREATE TABLE users (
    id              UUID PRIMARY KEY,
    organization_id UUID         NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(100) NOT NULL,
    roles           VARCHAR(100) NOT NULL,
    status          VARCHAR(20)  NOT NULL,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL,
    updated_at      TIMESTAMPTZ  NOT NULL
);

CREATE UNIQUE INDEX ux_users_email ON users (email);

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    family_id  UUID        NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX ux_refresh_tokens_hash ON refresh_tokens (token_hash);
CREATE INDEX ix_refresh_tokens_family ON refresh_tokens (family_id);
CREATE INDEX ix_refresh_tokens_user ON refresh_tokens (user_id);
