package com.banquethub.modules.menus.repository;

import com.banquethub.modules.menus.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByMenuIdOrderByDisplayOrderAsc(Long menuId);
    void deleteByMenuId(Long menuId);
}
