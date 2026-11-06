package com.banquethub.modules.ai.dto;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AiMenuRecommendationResponse {

    private UUID requestId;
    private String source; // "GEMINI" or "RULE_BASED"
    private List<MenuSuggestionDto> suggestions = new ArrayList<>();
    private String message;
    private OffsetDateTime generatedAt;

    public AiMenuRecommendationResponse() {
    }

    public AiMenuRecommendationResponse(UUID requestId, String source, List<MenuSuggestionDto> suggestions, String message, OffsetDateTime generatedAt) {
        this.requestId = requestId;
        this.source = source;
        this.suggestions = suggestions;
        this.message = message;
        this.generatedAt = generatedAt;
    }

    public UUID getRequestId() {
        return requestId;
    }

    public void setRequestId(UUID requestId) {
        this.requestId = requestId;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public List<MenuSuggestionDto> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<MenuSuggestionDto> suggestions) {
        this.suggestions = suggestions;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public OffsetDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(OffsetDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}
