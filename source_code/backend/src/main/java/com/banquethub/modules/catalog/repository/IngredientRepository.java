package com.banquethub.modules.catalog.repository;

import com.banquethub.modules.catalog.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    List<Ingredient> findAllByOrderByNameAsc();

    List<Ingredient> findByActiveTrueOrderByNameAsc();

    Optional<Ingredient> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    @Query(value = "SELECT nextval('ingredient_code_seq')", nativeQuery = true)
    Long getNextIngredientCodeSeq();

    @Query("SELECT i FROM Ingredient i WHERE i.currentStock <= i.minStockThreshold AND i.active = true ORDER BY (i.currentStock - i.minStockThreshold) ASC, i.name ASC")
    List<Ingredient> findLowStockIngredients();

    @Query("SELECT i FROM Ingredient i WHERE " +
           "(:keyword IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(i.code) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:active IS NULL OR i.active = :active) " +
           "AND (:lowStockOnly = false OR i.currentStock <= i.minStockThreshold) " +
           "ORDER BY i.name ASC")
    List<Ingredient> searchIngredients(
            @Param("keyword") String keyword,
            @Param("active") Boolean active,
            @Param("lowStockOnly") boolean lowStockOnly
    );
}

