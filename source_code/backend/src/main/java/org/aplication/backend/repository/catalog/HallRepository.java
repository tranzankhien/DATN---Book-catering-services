package org.aplication.backend.repository.catalog;

import java.util.List;
import java.util.UUID;
import org.aplication.backend.entity.catalog.HallEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HallRepository extends JpaRepository<HallEntity, UUID> {
    List<HallEntity> findByActiveTrueOrderByNameAsc();
}
