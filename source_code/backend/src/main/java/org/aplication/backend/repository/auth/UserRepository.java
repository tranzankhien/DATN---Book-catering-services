package org.aplication.backend.repository.auth;

import java.util.Optional;
import java.util.UUID;
import org.aplication.backend.entity.auth.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByPhone(String phone);
}
