package com.banquethub.modules.catalog.repository;

import com.banquethub.modules.catalog.entity.Dish;
import com.banquethub.modules.catalog.entity.DishStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DishRepository extends JpaRepository<Dish, Long> {

    @EntityGraph(attributePaths = {"category", "recipeItems", "recipeItems.ingredient"})
    List<Dish> findByStatusOrderByCategoryDisplayOrderAscNameAsc(DishStatus status);

    @EntityGraph(attributePaths = {"category", "recipeItems", "recipeItems.ingredient"})
    List<Dish> findAllByOrderByCategoryDisplayOrderAscNameAsc();

    @EntityGraph(attributePaths = {"category", "recipeItems", "recipeItems.ingredient"})
    Optional<Dish> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"category", "recipeItems", "recipeItems.ingredient"})
    Optional<Dish> findWithDetailsByIdAndStatus(Long id, DishStatus status);

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
}
