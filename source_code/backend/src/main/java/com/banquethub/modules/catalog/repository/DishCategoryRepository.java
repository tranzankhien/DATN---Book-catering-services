package com.banquethub.modules.catalog.repository;

import com.banquethub.modules.catalog.entity.DishCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DishCategoryRepository extends JpaRepository<DishCategory, Long> {

    List<DishCategory> findByActiveTrueOrderByDisplayOrderAscNameAsc();

    List<DishCategory> findAllByOrderByDisplayOrderAscNameAsc();

    Optional<DishCategory> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);
}
