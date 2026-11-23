package com.banquethub.modules.ai.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.modules.ai.dto.AiChatRequest;
import com.banquethub.modules.ai.dto.AiChatResponse;
import com.banquethub.modules.ai.service.ChatbotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai/chat")
@Tag(name = "AI Chatbot Assistant", description = "Trợ lý ảo thông minh tư vấn yến tiệc, chính sách và gợi ý thực đơn trực tiếp")
public class AiChatController {

    private final ChatbotService chatbotService;

    public AiChatController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping
    @Operation(summary = "Trò chuyện và hỏi đáp thông minh với Trợ lý AI BanquetHub")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(@Valid @RequestBody AiChatRequest request) {
        AiChatResponse response = chatbotService.chat(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
