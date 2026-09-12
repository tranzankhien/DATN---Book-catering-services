package org.aplication.backend.entity.auth;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "revoked_access_tokens")
public class RevokedAccessTokenEntity {
    @Id
    private UUID jti;
    private Instant expiresAt;

    protected RevokedAccessTokenEntity() {}

    public RevokedAccessTokenEntity(UUID jti, Instant expiresAt) {
        this.jti = jti;
        this.expiresAt = expiresAt;
    }

    public UUID getJti() { return jti; }
    public Instant getExpiresAt() { return expiresAt; }
}
