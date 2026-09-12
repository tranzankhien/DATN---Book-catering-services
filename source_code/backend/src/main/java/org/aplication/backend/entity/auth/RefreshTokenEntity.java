package org.aplication.backend.entity.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.aplication.backend.common.base.BaseEntity;

@Entity
@Table(name = "refresh_tokens")
public class RefreshTokenEntity extends BaseEntity {
    @Column(nullable = false)
    private UUID familyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant revokedAt;
    private UUID replacedBy;

    protected RefreshTokenEntity() {}

    public RefreshTokenEntity(UUID familyId, UserEntity user, String tokenHash, Instant expiresAt) {
        this.familyId = familyId;
        this.user = user;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
    }

    public UUID getFamilyId() { return familyId; }
    public UserEntity getUser() { return user; }
    public String getTokenHash() { return tokenHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getRevokedAt() { return revokedAt; }
    public boolean isExpired() { return !expiresAt.isAfter(Instant.now()); }
    public boolean isRevoked() { return revokedAt != null; }

    public void revoke(UUID replacementId) {
        revokedAt = Instant.now();
        replacedBy = replacementId;
    }

    public void revoke() { revokedAt = Instant.now(); }
}
