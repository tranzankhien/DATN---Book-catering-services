package com.banquethub.modules.menus.dto;

import com.banquethub.modules.menus.entity.Menu;
import com.banquethub.modules.menus.entity.MenuStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;

public class MenuResponse {

    private Long id;
    private String code;
    private String name;
    private String description;
    private String imageUrl;
    private MenuStatus status;
    private BigDecimal pricePerTable;
    private int itemsCount;
    private List<MenuItemResponse> items;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public MenuResponse() {}

    public static MenuResponse fromEntity(Menu menu) {
        MenuResponse resp = new MenuResponse();
        resp.setId(menu.getId());
        resp.setCode(menu.getCode());
        resp.setName(menu.getName());
        resp.setDescription(menu.getDescription());
        resp.setImageUrl(menu.getImageUrl());
        resp.setStatus(menu.getStatus());
        resp.setPricePerTable(menu.calculatePricePerTable());
        if (menu.getMenuItems() != null) {
            resp.setItemsCount(menu.getMenuItems().size());
            resp.setItems(menu.getMenuItems().stream()
                    .map(MenuItemResponse::fromEntity)
                    .toList());
        } else {
            resp.setItemsCount(0);
            resp.setItems(Collections.emptyList());
        }
        resp.setCreatedAt(menu.getCreatedAt());
        resp.setUpdatedAt(menu.getUpdatedAt());
        return resp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public MenuStatus getStatus() {
        return status;
    }

    public void setStatus(MenuStatus status) {
        this.status = status;
    }

    public BigDecimal getPricePerTable() {
        return pricePerTable;
    }

    public void setPricePerTable(BigDecimal pricePerTable) {
        this.pricePerTable = pricePerTable;
    }

    public int getItemsCount() {
        return itemsCount;
    }

    public void setItemsCount(int itemsCount) {
        this.itemsCount = itemsCount;
    }

    public List<MenuItemResponse> getItems() {
        return items;
    }

    public void setItems(List<MenuItemResponse> items) {
        this.items = items;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
