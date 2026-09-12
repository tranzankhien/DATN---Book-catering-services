package org.aplication.backend.repository.catalog;

import java.util.List;
import java.util.UUID;
import org.aplication.backend.entity.catalog.DishCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DishCategoryRepository extends JpaRepository<DishCategoryEntity, UUID> {
    List<DishCategoryEntity> findByActiveTrueOrderByDisplayOrderAscNameAsc();
}
