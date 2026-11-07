package com.banquethub.modules.ai.service;

import com.banquethub.modules.ai.config.GeminiProperties;
import com.banquethub.modules.ai.dto.AiMenuRecommendationRequest;
import com.banquethub.modules.ai.dto.DishCandidateDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiClientService {

    private static final Logger log = LoggerFactory.getLogger(GeminiClientService.class);
    private static final String GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

    private final GeminiProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public GeminiClientService(GeminiProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        int timeoutMs = properties.getTimeoutSeconds() > 0 ? properties.getTimeoutSeconds() * 1000 : 30000;
        requestFactory.setConnectTimeout(Duration.ofMillis(5000));
        requestFactory.setReadTimeout(Duration.ofMillis(timeoutMs));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .build();
    }

    public record GeminiCallResult(
            RawAiSuggestions suggestions,
            int promptTokens,
            int outputTokens,
            long responseTimeMs
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RawAiSuggestions(List<RawAiSuggestion> suggestions) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RawAiSuggestion(String name, String reason, List<RawAiItem> items) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RawAiItem(Long dishId, Integer quantityPerTable) {}

    public GeminiCallResult callGemini(AiMenuRecommendationRequest request, List<DishCandidateDto> candidates) {
        if (!properties.isEnabled() || properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new IllegalStateException("Gemini API chưa được cấu hình hoặc đang bị tắt.");
        }

        String model = properties.getModel() != null && !properties.getModel().isBlank()
                ? properties.getModel()
                : "gemini-flash-lite-latest";

        String url = GEMINI_API_BASE_URL + model + ":generateContent";

        long startTime = System.currentTimeMillis();

        Map<String, Object> requestBody = buildGeminiRequestBody(request, candidates);

        String responseBody;
        try {
            responseBody = restClient.post()
                    .uri(url)
                    .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .header("X-goog-api-key", properties.getApiKey())
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            log.error("Lỗi khi gửi yêu cầu tới Gemini API: {}", e.getMessage());
            throw new RuntimeException("Không thể kết nối tới Google Gemini API: " + e.getMessage(), e);
        }

        long responseTimeMs = System.currentTimeMillis() - startTime;

        return parseGeminiResponse(responseBody, responseTimeMs);
    }

    private Map<String, Object> buildGeminiRequestBody(AiMenuRecommendationRequest request, List<DishCandidateDto> candidates) {
        String systemInstructionText = """
                Bạn là chuyên gia tư vấn yến tiệc và ẩm thực chuyên nghiệp của BanquetHub.
                Nhiệm vụ của bạn là xây dựng từ 1 đến tối đa 3 phương án thực đơn cho một bàn tiệc (chuẩn 10 khách), bám sát nhu cầu của khách hàng:
                - Mô tả nhu cầu, loại tiệc, khẩu vị, số bàn, số người mỗi bàn.
                - Ngân sách dự kiến (nếu khách nêu trong mô tả hoặc trong tham số ngân sách).
                - Danh sách món ăn hợp lệ được cung cấp từ cơ sở dữ liệu thực tế.
                - Sở thích và những nguyên liệu cần tránh/dị ứng.

                QUY TẮC BẮT BUỘC:
                1. BẠN CHỈ ĐƯỢC CHỌN dishId CÓ TRONG DANH SÁCH MÓN ĐƯỢC CUNG CẤP.
                2. Tuyệt đối không tự bịa ra món mới, mã món hoặc giá bán.
                3. Không tự ý khẳng định tình trạng tồn kho.
                4. Mỗi phương án gồm danh sách món (dishId) và số lượng mỗi món cho 01 bàn (quantityPerTable: số nguyên dương, tối thiểu 1).
                5. Cân đối ngân sách:
                   - Nếu khách hàng mong muốn ngân sách cao, hãy ưu tiên các món hải sản cao cấp, đặc sản thượng hạng (cá tầm, bò hầm tiêu xanh, heo sữa quay giòn bì, lẩu hải sản, cá song đỏ...) và có thể tăng số lượng món hoặc số phần (quantityPerTable) để bàn tiệc thịnh soạn xứng tầm.
                   - Nếu ngân sách tiết kiệm, ưu tiên các món thanh đạm, hài hòa chi phí.
                6. Đa dạng hóa 3 phương án:
                   - Phương án 1: Tiết kiệm / Hợp lý, thanh tao.
                   - Phương án 2: Cân bằng dinh dưỡng & phong phú, hài hòa khẩu vị.
                   - Phương án 3: Thịnh soạn, đẳng cấp & đặc sắc.
                7. Trả về kết quả JSON theo đúng schema quy định.
                """;

        // Build User Prompt Payload
        Map<String, Object> userPayload = new HashMap<>();
        userPayload.put("requestText", request.getRequestText());
        userPayload.put("eventType", request.getEventType() != null ? request.getEventType() : "Tiệc chung");
        userPayload.put("tableCount", request.getTableCount());
        userPayload.put("guestsPerTable", request.getGuestsPerTable());
        if (request.getBudgetAmount() != null) {
            userPayload.put("budgetAmount", request.getBudgetAmount());
            userPayload.put("budgetType", request.getBudgetType().name());
        }
        if (request.getPreferences() != null && !request.getPreferences().isBlank()) {
            userPayload.put("preferences", request.getPreferences());
        }
        if (request.getExcludedIngredients() != null && !request.getExcludedIngredients().isBlank()) {
            userPayload.put("excludedIngredients", request.getExcludedIngredients());
        }
        userPayload.put("availableCandidateDishes", candidates);

        String userPromptText;
        try {
            userPromptText = "Dưới đây là thông tin yêu cầu của khách hàng và danh sách món ăn khả dụng từ hệ thống:\n"
                    + objectMapper.writeValueAsString(userPayload);
        } catch (JsonProcessingException e) {
            userPromptText = "Yêu cầu: " + request.getRequestText();
        }

        Map<String, Object> body = new HashMap<>();

        // System Instruction
        body.put("system_instruction", Map.of(
                "parts", List.of(Map.of("text", systemInstructionText))
        ));

        // Contents
        body.put("contents", List.of(
                Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", userPromptText))
                )
        ));

        // Generation Config with Structured JSON Schema
        Map<String, Object> jsonSchema = buildStructuredJsonSchema();
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("responseSchema", jsonSchema);
        generationConfig.put("maxOutputTokens", properties.getMaxOutputTokens() > 0 ? properties.getMaxOutputTokens() : 4096);
        generationConfig.put("temperature", 0.6);

        body.put("generationConfig", generationConfig);

        return body;
    }

    private Map<String, Object> buildStructuredJsonSchema() {
        Map<String, Object> itemSchema = Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "dishId", Map.of("type", "INTEGER", "description", "ID của món ăn từ danh sách ứng viên"),
                        "quantityPerTable", Map.of("type", "INTEGER", "description", "Số lượng phần cho 01 bàn tiệc, tối thiểu là 1")
                ),
                "required", List.of("dishId", "quantityPerTable")
        );

        Map<String, Object> suggestionSchema = Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "name", Map.of("type", "STRING", "description", "Tên phương án thực đơn (VD: Thực đơn tiệc truyền thống - Cân bằng)"),
                        "reason", Map.of("type", "STRING", "description", "Lý do lựa chọn ngắn gọn bằng tiếng Việt"),
                        "items", Map.of(
                                "type", "ARRAY",
                                "items", itemSchema,
                                "description", "Danh sách các món ăn trong thực đơn"
                        )
                ),
                "required", List.of("name", "reason", "items")
        );

        return Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "suggestions", Map.of(
                                "type", "ARRAY",
                                "items", suggestionSchema,
                                "description", "Danh sách từ 1 đến 3 phương án thực đơn gợi ý"
                        )
                ),
                "required", List.of("suggestions")
        );
    }

    private GeminiCallResult parseGeminiResponse(String responseJson, long responseTimeMs) {
        try {
            JsonNode root = objectMapper.readTree(responseJson);

            int promptTokens = 0;
            int outputTokens = 0;
            if (root.has("usageMetadata")) {
                JsonNode usage = root.get("usageMetadata");
                if (usage.has("promptTokenCount")) promptTokens = usage.get("promptTokenCount").asInt();
                if (usage.has("candidatesTokenCount")) outputTokens = usage.get("candidatesTokenCount").asInt();
            }

            JsonNode candidatesNode = root.get("candidates");
            if (candidatesNode == null || !candidatesNode.isArray() || candidatesNode.isEmpty()) {
                throw new IllegalStateException("Gemini không trả về kết quả candidates nào.");
            }

            JsonNode candidate = candidatesNode.get(0);
            JsonNode parts = candidate.path("content").path("parts");
            if (!parts.isArray() || parts.isEmpty()) {
                throw new IllegalStateException("Gemini content parts trống.");
            }

            String text = parts.get(0).path("text").asText("");
            if (text.isBlank()) {
                throw new IllegalStateException("Gemini text content trống.");
            }

            RawAiSuggestions raw = objectMapper.readValue(text, RawAiSuggestions.class);
            return new GeminiCallResult(raw, promptTokens, outputTokens, responseTimeMs);

        } catch (Exception e) {
            log.error("Không thể giải mã phản hồi JSON từ Gemini: {}", e.getMessage());
            throw new RuntimeException("Lỗi phân tích cú pháp phản hồi AI: " + e.getMessage(), e);
        }
    }
}
