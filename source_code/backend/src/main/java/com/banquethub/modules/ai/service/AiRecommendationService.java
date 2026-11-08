package com.banquethub.modules.ai.service;

import com.banquethub.modules.ai.config.GeminiProperties;
import com.banquethub.modules.ai.dto.AiMenuRecommendationRequest;
import com.banquethub.modules.ai.dto.AiMenuRecommendationResponse;
import com.banquethub.modules.ai.dto.AvailabilityStatus;
import com.banquethub.modules.ai.dto.BudgetStatus;
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
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Main coordinator service for AI Menu Recommendations.
 * Integrates atomic rate limiting, Gemini AI structured generation, DB price verification,
 * live stock reservation checking, and rule-based fallback handling.
 */
@Service
public class AiRecommendationService {

    private static final Logger log = LoggerFactory.getLogger(AiRecommendationService.class);

    // Concurrency guard to prevent overwhelming provider rate limits
    private final Semaphore concurrentCallLimiter = new Semaphore(10);

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

        // 1. Atomic Rate Limiting Check & Reservation (per user per hour)
        AiRecommendationUsage usageRecord = null;
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

            // Immediately record entry to prevent concurrent race condition bypass
            try {
                usageRecord = new AiRecommendationUsage(
                        currentUser.getId(),
                        geminiProperties.getModel(),
                        "GEMINI",
                        "STARTED",
                        0,
                        0,
                        0L
                );
                usageRecord = usageRepository.save(usageRecord);
            } catch (Exception e) {
                log.warn("Failed to create initial AI usage record: {}", e.getMessage());
            }
        }

        // 2. Query valid candidate dishes from PostgreSQL
        List<DishCandidateDto> candidates = menuCandidateService.getEligibleCandidates(request.getExcludedIngredients());
        if (candidates.isEmpty()) {
            if (usageRecord != null) {
                usageRecord.setStatus("EMPTY_CANDIDATES");
                usageRecord.setResponseTimeMs(System.currentTimeMillis() - startTime);
                usageRepository.save(usageRecord);
            }
            return new AiMenuRecommendationResponse(
                    requestId,
                    "EMPTY",
                    Collections.emptyList(),
                    "Hiện tại không có món ăn nào phù hợp với tiêu chí loại trừ hoặc đang hoạt động trong hệ thống.",
                    OffsetDateTime.now()
            );
        }

        Set<Long> candidateIds = candidates.stream().map(DishCandidateDto::getId).collect(Collectors.toSet());
        List<String> excludedKeywords = MenuCandidateService.parseExcludedKeywords(request.getExcludedIngredients());

        List<MenuSuggestionDto> validatedSuggestions = null;
        String source = "GEMINI";
        String message = "Gợi ý thực đơn thành công từ trợ lý AI BanquetHub.";
        String errorMessage = null;
        Integer promptTokens = 0;
        Integer candidateTokens = 0;

        // 3. Attempt Gemini Recommendation if enabled
        if (geminiProperties.isEnabled() && geminiProperties.getApiKey() != null && !geminiProperties.getApiKey().isBlank()) {
            boolean permitAcquired = false;
            try {
                permitAcquired = concurrentCallLimiter.tryAcquire(5, TimeUnit.SECONDS);
                if (permitAcquired) {
                    GeminiClientService.GeminiCallResult geminiResult =
                            geminiClientService.callGemini(request, candidates);

                    promptTokens = geminiResult.promptTokens();
                    candidateTokens = geminiResult.outputTokens();

                    if (geminiResult.suggestions() != null && geminiResult.suggestions().suggestions() != null && !geminiResult.suggestions().suggestions().isEmpty()) {
                        List<MenuSuggestionDto> rawValidated = validationService.validateAndEnrichSuggestions(
                                geminiResult.suggestions().suggestions(),
                                request,
                                candidateIds,
                                excludedKeywords
                        );

                        // Only accept feasible suggestions: must be fully AVAILABLE and not OVER_BUDGET
                        List<MenuSuggestionDto> feasibleSuggestions = rawValidated.stream()
                                .filter(s -> s.getAvailabilityStatus() == AvailabilityStatus.AVAILABLE)
                                .filter(s -> s.getBudgetStatus() != BudgetStatus.OVER_BUDGET)
                                .toList();

                        if (!feasibleSuggestions.isEmpty()) {
                            validatedSuggestions = feasibleSuggestions;
                            for (MenuSuggestionDto s : validatedSuggestions) {
                                s.setSource("GEMINI");
                            }
                        } else {
                            log.info("Gemini suggestions had stock shortages or budget violations. Discarding and using fallback.");
                        }
                    }
                } else {
                    log.warn("Gemini call concurrency capacity reached. Engaging rule-based fallback.");
                    errorMessage = "CONCURRENCY_LIMIT_REACHED";
                }
            } catch (Exception ex) {
                log.warn("Gemini menu recommendation encountered an error; engaging rule-based fallback: {}", ex.getClass().getSimpleName());
                errorMessage = ex.getMessage();
            } finally {
                if (permitAcquired) {
                    concurrentCallLimiter.release();
                }
            }
        } else {
            log.info("Gemini integration is disabled in configuration. Using rule-based fallback.");
        }

        // 4. Fallback if Gemini failed or produced no valid/feasible menus
        if (validatedSuggestions == null || validatedSuggestions.isEmpty()) {
            source = "RULE_BASED";
            validatedSuggestions = fallbackService.generateFallbackSuggestions(request, candidates);
            message = "Gợi ý thực đơn được khởi tạo theo thuật toán quy chuẩn dinh dưỡng và giá vốn của nhà hàng (hệ thống AI đang tạm thời ngoại tuyến hoặc đề xuất chưa tối ưu tồn kho).";
        }

        long latencyMs = System.currentTimeMillis() - startTime;

        // 5. Technical Audit Logging Update
        try {
            if (usageRecord != null) {
                usageRecord.setSource(source);
                usageRecord.setStatus(errorMessage == null ? "SUCCESS" : "FALLBACK");
                usageRecord.setPromptTokens(promptTokens);
                usageRecord.setOutputTokens(candidateTokens);
                usageRecord.setResponseTimeMs(latencyMs);
                usageRepository.save(usageRecord);
            }
        } catch (Exception ex) {
            log.error("Failed to update AI recommendation usage audit log: {}", ex.getMessage());
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
