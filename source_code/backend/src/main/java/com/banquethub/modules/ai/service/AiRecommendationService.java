package com.banquethub.modules.ai.service;

import com.banquethub.modules.ai.config.GeminiProperties;
import com.banquethub.modules.ai.dto.AiMenuRecommendationRequest;
import com.banquethub.modules.ai.dto.AiMenuRecommendationResponse;
import com.banquethub.modules.ai.dto.DishCandidateDto;
import com.banquethub.modules.ai.dto.MenuSuggestionDto;
import com.banquethub.modules.ai.entity.AiRecommendationUsage;
import com.banquethub.modules.ai.repository.AiRecommendationUsageRepository;
import com.banquethub.modules.users.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Main coordinator service for AI Menu Recommendations.
 * Integrates rate limiting, Gemini AI structured generation, DB price verification,
 * live stock reservation checking, and rule-based fallback handling.
 */
@Service
public class AiRecommendationService {

    private static final Logger log = LoggerFactory.getLogger(AiRecommendationService.class);

    private final GeminiProperties geminiProperties;
    private final MenuCandidateService menuCandidateService;
    private final GeminiClientService geminiClientService;
    private final RecommendationValidationService validationService;
    private final RecommendationFallbackService fallbackService;
    private final AiRecommendationUsageRepository usageRepository;

    public AiRecommendationService(
            GeminiProperties geminiProperties,
            MenuCandidateService menuCandidateService,
            GeminiClientService geminiClientService,
            RecommendationValidationService validationService,
            RecommendationFallbackService fallbackService,
            AiRecommendationUsageRepository usageRepository
    ) {
        this.geminiProperties = geminiProperties;
        this.menuCandidateService = menuCandidateService;
        this.geminiClientService = geminiClientService;
        this.validationService = validationService;
        this.fallbackService = fallbackService;
        this.usageRepository = usageRepository;
    }

    public AiMenuRecommendationResponse getRecommendations(
            AiMenuRecommendationRequest request,
            User currentUser
    ) {
        long startTime = System.currentTimeMillis();
        UUID requestId = UUID.randomUUID();

        // 1. Rate Limiting Check (per user per hour)
        if (currentUser != null && currentUser.getId() != null) {
            OffsetDateTime oneHourAgo = OffsetDateTime.now().minusHours(1);
            long recentCalls = usageRepository.countByUserIdAndCreatedAtAfter(currentUser.getId(), oneHourAgo);
            if (recentCalls >= geminiProperties.getMaxRequestsPerHour()) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "Bạn đã sử dụng tối đa " + geminiProperties.getMaxRequestsPerHour() +
                                " lượt gợi ý thực đơn trong 1 giờ. Vui lòng quay lại sau ít phút hoặc tự phối thực đơn."
                );
            }
        }

        // 2. Query valid candidate dishes from PostgreSQL
        List<DishCandidateDto> candidates = menuCandidateService.getEligibleCandidates(request.getExcludedIngredients());
        if (candidates.isEmpty()) {
            return new AiMenuRecommendationResponse(
                    requestId,
                    "EMPTY",
                    Collections.emptyList(),
                    "Hiện tại không có món ăn nào phù hợp với tiêu chí loại trừ hoặc đang hoạt động trong hệ thống.",
                    OffsetDateTime.now()
            );
        }

        List<MenuSuggestionDto> validatedSuggestions = null;
        String source = "GEMINI";
        String message = "Gợi ý thực đơn thành công từ trợ lý AI BanquetHub.";
        String errorMessage = null;
        Integer promptTokens = 0;
        Integer candidateTokens = 0;

        // 3. Attempt Gemini Recommendation if enabled
        if (geminiProperties.isEnabled() && geminiProperties.getApiKey() != null && !geminiProperties.getApiKey().isBlank()) {
            try {
                GeminiClientService.GeminiCallResult geminiResult =
                        geminiClientService.callGemini(request, candidates);

                promptTokens = geminiResult.promptTokens();
                candidateTokens = geminiResult.outputTokens();

                if (geminiResult.suggestions() != null && geminiResult.suggestions().suggestions() != null && !geminiResult.suggestions().suggestions().isEmpty()) {
                    validatedSuggestions = validationService.validateAndEnrichSuggestions(
                            geminiResult.suggestions().suggestions(),
                            request
                    );
                    for (MenuSuggestionDto s : validatedSuggestions) {
                        s.setSource("GEMINI");
                    }
                }
            } catch (Exception ex) {
                log.warn("Gemini menu recommendation encountered an error; engaging rule-based fallback: {}", ex.getMessage());
                errorMessage = ex.getMessage();
            }
        } else {
            log.info("Gemini integration is disabled in configuration. Using rule-based fallback.");
        }

        // 4. Fallback if Gemini failed or produced no valid menus
        if (validatedSuggestions == null || validatedSuggestions.isEmpty()) {
            source = "RULE_BASED";
            validatedSuggestions = fallbackService.generateFallbackSuggestions(request, candidates);
            message = "Gợi ý thực đơn được khởi tạo theo thuật toán quy chuẩn dinh dưỡng và giá vốn của nhà hàng (hệ thống AI đang tạm thời ngoại tuyến hoặc tải cao).";
        }

        long latencyMs = System.currentTimeMillis() - startTime;

        // 5. Technical Audit Logging (Does not expose private user text or API keys)
        try {
            if (currentUser != null && currentUser.getId() != null) {
                AiRecommendationUsage usage = new AiRecommendationUsage(
                        currentUser.getId(),
                        geminiProperties.getModel(),
                        source,
                        errorMessage == null ? "SUCCESS" : "FALLBACK",
                        promptTokens,
                        candidateTokens,
                        latencyMs
                );
                usageRepository.save(usage);
            }
        } catch (Exception ex) {
            log.error("Failed to save AI recommendation usage audit log: {}", ex.getMessage());
        }

        // 6. Return response
        return new AiMenuRecommendationResponse(
                requestId,
                source,
                validatedSuggestions,
                message,
                OffsetDateTime.now()
        );
    }
}
