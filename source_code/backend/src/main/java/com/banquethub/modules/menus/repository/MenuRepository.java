package com.banquethub.modules.menus.repository;

import com.banquethub.modules.menus.entity.Menu;
import com.banquethub.modules.menus.entity.MenuStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MenuRepository extends JpaRepository<Menu, Long>, JpaSpecificationExecutor<Menu> {

    List<Menu> findByStatusOrderByCreatedAtDesc(MenuStatus status);

    Optional<Menu> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    @Query(value = "SELECT nextval('menu_code_seq')", nativeQuery = true)
    Long getNextMenuCodeSeq();

    @Query("SELECT m FROM Menu m WHERE " +
           "(:keyword IS NULL OR LOWER(m.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(m.code) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:status IS NULL OR m.status = :status)")
    Page<Menu> searchMenus(
            @Param("keyword") String keyword,
            @Param("status") MenuStatus status,
            Pageable pageable
    );
}
