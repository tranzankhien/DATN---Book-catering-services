package org.aplication.backend.repository.catalog;

import java.util.List;
import java.util.UUID;
import org.aplication.backend.entity.catalog.DishEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DishRepository extends JpaRepository<DishEntity, UUID> {
    List<DishEntity> findByActiveTrueOrderByNameAsc();
    List<DishEntity> findByActiveTrueAndCategoryIdOrderByNameAsc(UUID categoryId);
    List<DishEntity> findByActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(String name);
}
