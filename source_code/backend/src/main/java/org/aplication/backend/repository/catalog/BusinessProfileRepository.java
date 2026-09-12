package org.aplication.backend.repository.catalog;

import java.util.Optional;
import java.util.UUID;
import org.aplication.backend.entity.catalog.BusinessProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessProfileRepository extends JpaRepository<BusinessProfileEntity, UUID> {
    Optional<BusinessProfileEntity> findFirstByOrderByCreatedAtAsc();
}
