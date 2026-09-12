package org.aplication.backend.repository.catalog;

import java.util.List;
import java.util.UUID;
import org.aplication.backend.entity.catalog.AdditionalServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdditionalServiceRepository extends JpaRepository<AdditionalServiceEntity, UUID> {
    List<AdditionalServiceEntity> findByActiveTrueOrderByNameAsc();
}
