package com.banquethub.modules.inventory.dto;

import com.banquethub.modules.inventory.entity.MovementType;
import com.banquethub.modules.inventory.entity.ReferenceType;
import com.banquethub.modules.inventory.entity.StockMovement;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class StockMovementResponse {

    private Long id;
    private Long ingredientId;
    private String ingredientCode;
    private String ingredientName;
    private String unit;
    private MovementType movementType;
    private BigDecimal quantityChange;
    private BigDecimal stockBefore;
    private BigDecimal stockAfter;
    private BigDecimal unitCost;
    private BigDecimal avgCostBefore;
    private BigDecimal avgCostAfter;
    private ReferenceType referenceType;
    private Long referenceId;
    private String referenceCode;
    private String note;
    private String performedByName;
    private OffsetDateTime createdAt;

    public StockMovementResponse() {
    }

    public static StockMovementResponse fromEntity(StockMovement m) {
        StockMovementResponse dto = new StockMovementResponse();
        dto.setId(m.getId());
        dto.setMovementType(m.getMovementType());
        dto.setQuantityChange(m.getQuantityChange());
        dto.setStockBefore(m.getStockBefore());
        dto.setStockAfter(m.getStockAfter());
        dto.setUnitCost(m.getUnitCost());
        dto.setAvgCostBefore(m.getAvgCostBefore());
        dto.setAvgCostAfter(m.getAvgCostAfter());
        dto.setReferenceType(m.getReferenceType());
        dto.setReferenceId(m.getReferenceId());
        dto.setReferenceCode(m.getReferenceCode());
        dto.setNote(m.getNote());
        dto.setPerformedByName(m.getPerformedByName());
        dto.setCreatedAt(m.getCreatedAt());

        if (m.getIngredient() != null) {
            dto.setIngredientId(m.getIngredient().getId());
            dto.setIngredientCode(m.getIngredient().getCode());
            dto.setIngredientName(m.getIngredient().getName());
            dto.setUnit(m.getIngredient().getUnit());
        }

        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIngredientId() {
        return ingredientId;
    }

    public void setIngredientId(Long ingredientId) {
        this.ingredientId = ingredientId;
    }

    public String getIngredientCode() {
        return ingredientCode;
    }

    public void setIngredientCode(String ingredientCode) {
        this.ingredientCode = ingredientCode;
    }

    public String getIngredientName() {
        return ingredientName;
    }

    public void setIngredientName(String ingredientName) {
        this.ingredientName = ingredientName;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public MovementType getMovementType() {
        return movementType;
    }

    public void setMovementType(MovementType movementType) {
        this.movementType = movementType;
    }

    public BigDecimal getQuantityChange() {
        return quantityChange;
    }

    public void setQuantityChange(BigDecimal quantityChange) {
        this.quantityChange = quantityChange;
    }

    public BigDecimal getStockBefore() {
        return stockBefore;
    }

    public void setStockBefore(BigDecimal stockBefore) {
        this.stockBefore = stockBefore;
    }

    public BigDecimal getStockAfter() {
        return stockAfter;
    }

    public void setStockAfter(BigDecimal stockAfter) {
        this.stockAfter = stockAfter;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public BigDecimal getAvgCostBefore() {
        return avgCostBefore;
    }

    public void setAvgCostBefore(BigDecimal avgCostBefore) {
        this.avgCostBefore = avgCostBefore;
    }

    public BigDecimal getAvgCostAfter() {
        return avgCostAfter;
    }

    public void setAvgCostAfter(BigDecimal avgCostAfter) {
        this.avgCostAfter = avgCostAfter;
    }

    public ReferenceType getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(ReferenceType referenceType) {
        this.referenceType = referenceType;
    }

    public Long getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Long referenceId) {
        this.referenceId = referenceId;
    }

    public String getReferenceCode() {
        return referenceCode;
    }

    public void setReferenceCode(String referenceCode) {
        this.referenceCode = referenceCode;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getPerformedByName() {
        return performedByName;
    }

    public void setPerformedByName(String performedByName) {
        this.performedByName = performedByName;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
