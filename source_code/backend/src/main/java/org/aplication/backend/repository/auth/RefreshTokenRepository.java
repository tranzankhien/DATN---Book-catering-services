package org.aplication.backend.repository.auth;

import java.util.Optional;
import java.util.UUID;
import org.aplication.backend.entity.auth.RefreshTokenEntity;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<RefreshTokenEntity> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update RefreshTokenEntity token set token.revokedAt = :now "
            + "where token.familyId = :familyId and token.revokedAt is null")
    int revokeFamily(@Param("familyId") UUID familyId, @Param("now") java.time.Instant now);
}
