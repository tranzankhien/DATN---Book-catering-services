package com.banquethub.modules.ai.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class AiChatResponse {

    private String reply;
    private List<String> suggestedQuestions = new ArrayList<>();
    private SuggestedMenuDto suggestedMenu;

    public AiChatResponse() {}

    public AiChatResponse(String reply, List<String> suggestedQuestions, SuggestedMenuDto suggestedMenu) {
        this.reply = reply;
        this.suggestedQuestions = suggestedQuestions != null ? suggestedQuestions : new ArrayList<>();
        this.suggestedMenu = suggestedMenu;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public List<String> getSuggestedQuestions() {
        return suggestedQuestions;
    }

    public void setSuggestedQuestions(List<String> suggestedQuestions) {
        this.suggestedQuestions = suggestedQuestions;
    }

    public SuggestedMenuDto getSuggestedMenu() {
        return suggestedMenu;
    }

    public void setSuggestedMenu(SuggestedMenuDto suggestedMenu) {
        this.suggestedMenu = suggestedMenu;
    }

    public static class SuggestedMenuDto {
        private String name;
        private BigDecimal pricePerTable;
        private List<SuggestedDishDto> dishes = new ArrayList<>();

        public SuggestedMenuDto() {}

        public SuggestedMenuDto(String name, BigDecimal pricePerTable, List<SuggestedDishDto> dishes) {
            this.name = name;
            this.pricePerTable = pricePerTable;
            this.dishes = dishes != null ? dishes : new ArrayList<>();
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public BigDecimal getPricePerTable() {
            return pricePerTable;
        }

        public void setPricePerTable(BigDecimal pricePerTable) {
            this.pricePerTable = pricePerTable;
        }

        public List<SuggestedDishDto> getDishes() {
            return dishes;
        }

        public void setDishes(List<SuggestedDishDto> dishes) {
            this.dishes = dishes;
        }
    }

    public static class SuggestedDishDto {
        private Long id;
        private String code;
        private String name;
        private String categoryName;
        private BigDecimal price;
        private String imageUrl;

        public SuggestedDishDto() {}

        public SuggestedDishDto(Long id, String code, String name, String categoryName, BigDecimal price, String imageUrl) {
            this.id = id;
            this.code = code;
            this.name = name;
            this.categoryName = categoryName;
            this.price = price;
            this.imageUrl = imageUrl;
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

        public String getCategoryName() {
            return categoryName;
        }

        public void setCategoryName(String categoryName) {
            this.categoryName = categoryName;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }

        public String getImageUrl() {
            return imageUrl;
        }

        public void setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
        }
    }
}
