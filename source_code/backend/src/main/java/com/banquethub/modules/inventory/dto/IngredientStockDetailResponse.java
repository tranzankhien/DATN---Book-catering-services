package com.banquethub.modules.inventory.dto;

import com.banquethub.modules.catalog.dto.IngredientResponse;

import java.util.ArrayList;
import java.util.List;

public class IngredientStockDetailResponse {

    private IngredientResponse ingredient;
    private boolean canDelete;
    private String deleteBlockReason;
    private List<UsedInDishSummary> usedInDishes = new ArrayList<>();
    private List<StockMovementResponse> recentMovements = new ArrayList<>();

    public IngredientStockDetailResponse() {
    }

    public static class UsedInDishSummary {
        private Long dishId;
        private String dishCode;
        private String dishName;
        private String dishStatus;
        private String portionQuantity;

        public UsedInDishSummary() {
        }

        public UsedInDishSummary(Long dishId, String dishCode, String dishName, String dishStatus, String portionQuantity) {
            this.dishId = dishId;
            this.dishCode = dishCode;
            this.dishName = dishName;
            this.dishStatus = dishStatus;
            this.portionQuantity = portionQuantity;
        }

        public Long getDishId() {
            return dishId;
        }

        public void setDishId(Long dishId) {
            this.dishId = dishId;
        }

        public String getDishCode() {
            return dishCode;
        }

        public void setDishCode(String dishCode) {
            this.dishCode = dishCode;
        }

        public String getDishName() {
            return dishName;
        }

        public void setDishName(String dishName) {
            this.dishName = dishName;
        }

        public String getDishStatus() {
            return dishStatus;
        }

        public void setDishStatus(String dishStatus) {
            this.dishStatus = dishStatus;
        }

        public String getPortionQuantity() {
            return portionQuantity;
        }

        public void setPortionQuantity(String portionQuantity) {
            this.portionQuantity = portionQuantity;
        }
    }

    public IngredientResponse getIngredient() {
        return ingredient;
    }

    public void setIngredient(IngredientResponse ingredient) {
        this.ingredient = ingredient;
    }

    public boolean isCanDelete() {
        return canDelete;
    }

    public void setCanDelete(boolean canDelete) {
        this.canDelete = canDelete;
    }

    public String getDeleteBlockReason() {
        return deleteBlockReason;
    }

    public void setDeleteBlockReason(String deleteBlockReason) {
        this.deleteBlockReason = deleteBlockReason;
    }

    public List<UsedInDishSummary> getUsedInDishes() {
        return usedInDishes;
    }

    public void setUsedInDishes(List<UsedInDishSummary> usedInDishes) {
        this.usedInDishes = usedInDishes;
    }

    public List<StockMovementResponse> getRecentMovements() {
        return recentMovements;
    }

    public void setRecentMovements(List<StockMovementResponse> recentMovements) {
        this.recentMovements = recentMovements;
    }
}
