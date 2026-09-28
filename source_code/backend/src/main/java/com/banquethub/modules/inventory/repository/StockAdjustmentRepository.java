package com.banquethub.modules.inventory.repository;

import com.banquethub.modules.inventory.entity.StockAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, Long> {

    @Query(value = "SELECT nextval('stock_adjustment_code_seq')", nativeQuery = true)
    Long getNextAdjustmentCodeSeq();

    List<StockAdjustment> findByIngredientIdOrderByCreatedAtDesc(Long ingredientId);

    boolean existsByIngredientId(Long ingredientId);
}

