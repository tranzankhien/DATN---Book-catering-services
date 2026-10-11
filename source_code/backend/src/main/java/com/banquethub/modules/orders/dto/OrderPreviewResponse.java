package com.banquethub.modules.orders.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class OrderPreviewResponse {

    private Long menuId;
    private String menuName;
    private Integer tableCount;
    private BigDecimal pricePerTable = BigDecimal.ZERO;
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private List<OrderItemPreviewResponse> items = new ArrayList<>();
    private List<IngredientDemandPreview> ingredientDemands = new ArrayList<>();
    private boolean canProceed = true;
    private List<String> validationMessages = new ArrayList<>();

    public OrderPreviewResponse() {}

    public Long getMenuId() {
        return menuId;
    }

    public void setMenuId(Long menuId) {
        this.menuId = menuId;
    }

    public String getMenuName() {
        return menuName;
    }

    public void setMenuName(String menuName) {
        this.menuName = menuName;
    }

    public Integer getTableCount() {
        return tableCount;
    }

    public void setTableCount(Integer tableCount) {
        this.tableCount = tableCount;
    }

    public BigDecimal getPricePerTable() {
        return pricePerTable;
    }

    public void setPricePerTable(BigDecimal pricePerTable) {
        this.pricePerTable = pricePerTable;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public List<OrderItemPreviewResponse> getItems() {
        return items;
    }

    public void setItems(List<OrderItemPreviewResponse> items) {
        this.items = items;
    }

    public List<IngredientDemandPreview> getIngredientDemands() {
        return ingredientDemands;
    }

    public void setIngredientDemands(List<IngredientDemandPreview> ingredientDemands) {
        this.ingredientDemands = ingredientDemands;
    }

    public boolean isCanProceed() {
        return canProceed;
    }

    public void setCanProceed(boolean canProceed) {
        this.canProceed = canProceed;
    }

    public List<String> getValidationMessages() {
        return validationMessages;
    }

    public void setValidationMessages(List<String> validationMessages) {
        this.validationMessages = validationMessages;
    }
}
