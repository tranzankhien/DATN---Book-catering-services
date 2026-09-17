package com.banquethub.modules.catalog.repository;

import com.banquethub.modules.catalog.entity.RecipeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecipeItemRepository extends JpaRepository<RecipeItem, Long> {

    @Modifying
    @Query("DELETE FROM RecipeItem r WHERE r.dish.id = :dishId")
    void deleteByDishId(@Param("dishId") Long dishId);
}
