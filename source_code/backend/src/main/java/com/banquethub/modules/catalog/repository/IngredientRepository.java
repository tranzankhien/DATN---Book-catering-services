package com.banquethub.modules.catalog.repository;

import com.banquethub.modules.catalog.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    List<Ingredient> findAllByOrderByNameAsc();

    List<Ingredient> findByActiveTrueOrderByNameAsc();

    Optional<Ingredient> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);
}
