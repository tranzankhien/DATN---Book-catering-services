package com.banquethub.modules.inventory.repository;

import com.banquethub.modules.inventory.entity.MovementType;
import com.banquethub.modules.inventory.entity.StockMovement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long>, JpaSpecificationExecutor<StockMovement> {

    List<StockMovement> findByIngredientIdOrderByCreatedAtDesc(Long ingredientId);

    boolean existsByIngredientId(Long ingredientId);

    @Query("SELECT m FROM StockMovement m JOIN FETCH m.ingredient WHERE m.ingredient.id = :ingredientId ORDER BY m.createdAt DESC, m.id DESC")
    List<StockMovement> findTopByIngredientId(@Param("ingredientId") Long ingredientId, Pageable pageable);
}

