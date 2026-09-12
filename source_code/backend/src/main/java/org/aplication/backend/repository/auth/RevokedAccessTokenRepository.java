package org.aplication.backend.repository.auth;

import java.time.Instant;
import java.util.UUID;
import org.aplication.backend.entity.auth.RevokedAccessTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RevokedAccessTokenRepository extends JpaRepository<RevokedAccessTokenEntity, UUID> {
    long deleteByExpiresAtBefore(Instant now);
}
