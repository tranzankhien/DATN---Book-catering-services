package org.aplication.backend.repository.auth;

import java.util.Optional;
import java.util.UUID;
import org.aplication.backend.entity.auth.PendingRegistrationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PendingRegistrationRepository extends JpaRepository<PendingRegistrationEntity, UUID> {
    Optional<PendingRegistrationEntity> findByEmailIgnoreCase(String email);
    Optional<PendingRegistrationEntity> findByPhone(String phone);
}
