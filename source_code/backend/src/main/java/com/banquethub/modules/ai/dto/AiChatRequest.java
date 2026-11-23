package com.banquethub.modules.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

public class AiChatRequest {

    @NotBlank(message = "Tin nhắn không được để trống")
    @Size(max = 1000, message = "Tin nhắn tối đa 1000 ký tự")
    private String message;

    private List<AiChatMessageDto> history = new ArrayList<>();

    public AiChatRequest() {}

    public AiChatRequest(String message, List<AiChatMessageDto> history) {
        this.message = message;
        this.history = history;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<AiChatMessageDto> getHistory() {
        return history;
    }

    public void setHistory(List<AiChatMessageDto> history) {
        this.history = history;
    }
}
