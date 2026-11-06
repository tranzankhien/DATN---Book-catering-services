package com.banquethub.modules.ai.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class MenuSuggestionDto {

    private String name;
    private String description;
    private String reason;
    private String source;
    private Integer matchScore;
    private List<MenuSuggestionItemDto> items = new ArrayList<>();
    private BigDecimal totalPerTable;
    private Integer tableCount;
    private BigDecimal totalOrderAmount;
    private BudgetStatus budgetStatus;
    private AvailabilityStatus availabilityStatus;
    private List<String> validationMessages = new ArrayList<>();

    public MenuSuggestionDto() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTitle() {
        return name;
    }

    public void setTitle(String title) {
        this.name = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public Integer getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(Integer matchScore) {
        this.matchScore = matchScore;
    }

    public List<MenuSuggestionItemDto> getItems() {
        return items;
    }

    public void setItems(List<MenuSuggestionItemDto> items) {
        this.items = items;
    }

    public BigDecimal getTotalPerTable() {
        return totalPerTable;
    }

    public void setTotalPerTable(BigDecimal totalPerTable) {
        this.totalPerTable = totalPerTable;
    }

    public Integer getTableCount() {
        return tableCount;
    }

    public void setTableCount(Integer tableCount) {
        this.tableCount = tableCount;
    }

    public BigDecimal getTotalOrderAmount() {
        return totalOrderAmount;
    }

    public void setTotalOrderAmount(BigDecimal totalOrderAmount) {
        this.totalOrderAmount = totalOrderAmount;
    }

    public BudgetStatus getBudgetStatus() {
        return budgetStatus;
    }

    public void setBudgetStatus(BudgetStatus budgetStatus) {
        this.budgetStatus = budgetStatus;
    }

    public AvailabilityStatus getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(AvailabilityStatus availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }

    public List<String> getValidationMessages() {
        return validationMessages;
    }

    public void setValidationMessages(List<String> validationMessages) {
        this.validationMessages = validationMessages;
    }
}
