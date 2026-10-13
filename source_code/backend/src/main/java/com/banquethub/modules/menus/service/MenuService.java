package com.banquethub.modules.menus.service;

import com.banquethub.common.exception.BusinessValidationException;
import com.banquethub.common.exception.ResourceNotFoundException;
import com.banquethub.modules.catalog.entity.Dish;
import com.banquethub.modules.catalog.entity.DishStatus;
import com.banquethub.modules.catalog.repository.DishRepository;
import com.banquethub.modules.menus.dto.CreateMenuRequest;
import com.banquethub.modules.menus.dto.MenuItemRequest;
import com.banquethub.modules.menus.dto.MenuResponse;
import com.banquethub.modules.menus.dto.UpdateMenuRequest;
import com.banquethub.modules.menus.entity.Menu;
import com.banquethub.modules.menus.entity.MenuItem;
import com.banquethub.modules.menus.entity.MenuStatus;
import com.banquethub.modules.menus.repository.MenuItemRepository;
import com.banquethub.modules.menus.repository.MenuRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MenuService {

    private final MenuRepository menuRepository;
    private final MenuItemRepository menuItemRepository;
    private final DishRepository dishRepository;

    public MenuService(
            MenuRepository menuRepository,
            MenuItemRepository menuItemRepository,
            DishRepository dishRepository
    ) {
        this.menuRepository = menuRepository;
        this.menuItemRepository = menuItemRepository;
        this.dishRepository = dishRepository;
    }

    @Transactional(readOnly = true)
    public List<MenuResponse> getActiveMenus() {
        return menuRepository.findByStatusOrderByCreatedAtDesc(MenuStatus.ACTIVE).stream()
                .map(MenuResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public MenuResponse getPublicMenuById(Long id) {
        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thực đơn với ID: " + id));
        if (menu.getStatus() != MenuStatus.ACTIVE) {
            throw new ResourceNotFoundException("Thực đơn này hiện đang tạm ẩn hoặc ngừng phục vụ.");
        }
        return MenuResponse.fromEntity(menu);
    }

    @Transactional(readOnly = true)
    public MenuResponse getPublicMenuByCode(String code) {
        Menu menu = menuRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thực đơn với mã: " + code));
        if (menu.getStatus() != MenuStatus.ACTIVE) {
            throw new ResourceNotFoundException("Thực đơn này hiện đang tạm ẩn hoặc ngừng phục vụ.");
        }
        return MenuResponse.fromEntity(menu);
    }

    @Transactional(readOnly = true)
    public MenuResponse getMenuById(Long id) {
        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thực đơn với ID: " + id));
        return MenuResponse.fromEntity(menu);
    }

    @Transactional(readOnly = true)
    public MenuResponse getMenuByCode(String code) {
        Menu menu = menuRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thực đơn với mã: " + code));
        return MenuResponse.fromEntity(menu);
    }

    @Transactional(readOnly = true)
    public Page<MenuResponse> searchAdminMenus(String keyword, MenuStatus status, Pageable pageable) {
        String kw = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        return menuRepository.searchMenus(kw, status, pageable).map(MenuResponse::fromEntity);
    }

    @Transactional
    public MenuResponse createMenu(CreateMenuRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessValidationException("Thực đơn phải có ít nhất 1 món ăn.");
        }

        validateMenuItems(request.getItems());

        Long nextSeq = menuRepository.getNextMenuCodeSeq();
        String code = String.format("MN-%04d", nextSeq);

        Menu menu = new Menu();
        menu.setCode(code);
        menu.setName(request.getName().trim());
        menu.setDescription(request.getDescription());
        menu.setImageUrl(request.getImageUrl());
        menu.setStatus(MenuStatus.ACTIVE);

        populateMenuItems(menu, request.getItems());

        Menu saved = menuRepository.save(menu);
        return MenuResponse.fromEntity(saved);
    }

    @Transactional
    public MenuResponse updateMenu(Long id, UpdateMenuRequest request) {
        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thực đơn với ID: " + id));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessValidationException("Thực đơn phải có ít nhất 1 món ăn.");
        }

        validateMenuItems(request.getItems());

        menu.setName(request.getName().trim());
        menu.setDescription(request.getDescription());
        menu.setImageUrl(request.getImageUrl());

        menu.clearMenuItems();
        populateMenuItems(menu, request.getItems());

        Menu saved = menuRepository.save(menu);
        return MenuResponse.fromEntity(saved);
    }

    @Transactional
    public MenuResponse updateMenuStatus(Long id, MenuStatus status) {
        Menu menu = menuRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thực đơn với ID: " + id));

        menu.setStatus(status);
        Menu saved = menuRepository.save(menu);
        return MenuResponse.fromEntity(saved);
    }

    private void validateMenuItems(List<MenuItemRequest> items) {
        Set<Long> dishIds = new HashSet<>();
        for (MenuItemRequest item : items) {
            if (item.getDishId() == null) {
                throw new BusinessValidationException("Món ăn trong thực đơn không được để trống.");
            }
            if (item.getQuantityPerTable() == null || item.getQuantityPerTable() <= 0) {
                throw new BusinessValidationException("Số lượng món cho mỗi bàn phải từ 1 trở lên.");
            }
            if (!dishIds.add(item.getDishId())) {
                throw new BusinessValidationException("Món ăn không được trùng lặp trong cùng một thực đơn.");
            }
        }
    }

    private void populateMenuItems(Menu menu, List<MenuItemRequest> items) {
        List<Long> dishIds = items.stream().map(MenuItemRequest::getDishId).toList();
        Map<Long, Dish> dishMap = dishRepository.findAllById(dishIds).stream()
                .collect(Collectors.toMap(Dish::getId, Function.identity()));

        int order = 1;
        for (MenuItemRequest itemReq : items) {
            Dish dish = dishMap.get(itemReq.getDishId());
            if (dish == null) {
                throw new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + itemReq.getDishId());
            }
            if (dish.getStatus() != DishStatus.ACTIVE) {
                throw new BusinessValidationException("Món '" + dish.getName() + "' hiện đang ngừng phục vụ, không thể thêm vào thực đơn.");
            }

            MenuItem menuItem = new MenuItem();
            menuItem.setDish(dish);
            menuItem.setQuantityPerTable(itemReq.getQuantityPerTable());
            menuItem.setDisplayOrder(itemReq.getDisplayOrder() != null && itemReq.getDisplayOrder() > 0 ? itemReq.getDisplayOrder() : order++);

            menu.addMenuItem(menuItem);
        }
    }
}
