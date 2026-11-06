package com.banquethub.modules.ai.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class AiMenuRecommendationRequest {

    @NotBlank(message = "Mô tả nhu cầu bữa tiệc không được để trống.")
    @Size(max = 500, message = "Mô tả nhu cầu bữa tiệc không được vượt quá 500 ký tự.")
    private String requestText;

    @Size(max = 100, message = "Loại tiệc không được vượt quá 100 ký tự.")
    private String eventType;

    @NotNull(message = "Số lượng bàn tiệc không được để trống.")
    @Min(value = 1, message = "Số bàn phải từ 1 bàn trở lên.")
    @Max(value = 500, message = "Số bàn không được vượt quá 500 bàn.")
    private Integer tableCount = 1;

    @NotNull(message = "Số khách mỗi bàn không được để trống.")
    @Min(value = 1, message = "Số khách mỗi bàn phải từ 1 người trở lên.")
    @Max(value = 50, message = "Số khách mỗi bàn không vượt quá 50 người.")
    private Integer guestsPerTable = 6;

    @DecimalMin(value = "0.01", message = "Ngân sách dự kiến phải lớn hơn 0.")
    private BigDecimal budgetAmount;

    private BudgetType budgetType = BudgetType.PER_TABLE;

    @Size(max = 255, message = "Sở thích món ăn không được vượt quá 255 ký tự.")
    private String preferences;

    @Size(max = 255, message = "Nguyên liệu cần tránh không được vượt quá 255 ký tự.")
    private String excludedIngredients;

    public AiMenuRecommendationRequest() {
    }

    public String getRequestText() {
        return requestText;
    }

    public void setRequestText(String requestText) {
        this.requestText = requestText;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Integer getTableCount() {
        return tableCount != null ? tableCount : 1;
    }

    public void setTableCount(Integer tableCount) {
        this.tableCount = tableCount;
    }

    public Integer getGuestsPerTable() {
        return guestsPerTable != null ? guestsPerTable : 6;
    }

    public void setGuestsPerTable(Integer guestsPerTable) {
        this.guestsPerTable = guestsPerTable;
    }

    public BigDecimal getBudgetAmount() {
        return budgetAmount;
    }

    public void setBudgetAmount(BigDecimal budgetAmount) {
        this.budgetAmount = budgetAmount;
    }

    public BudgetType getBudgetType() {
        return budgetType != null ? budgetType : BudgetType.PER_TABLE;
    }

    public void setBudgetType(BudgetType budgetType) {
        this.budgetType = budgetType;
    }

    public String getPreferences() {
        return preferences;
    }

    public void setPreferences(String preferences) {
        this.preferences = preferences;
    }

    public String getExcludedIngredients() {
        return excludedIngredients;
    }

    public void setExcludedIngredients(String excludedIngredients) {
        this.excludedIngredients = excludedIngredients;
    }
}
