package com.banquethub.modules.ai.service;

import com.banquethub.modules.ai.config.GeminiProperties;
import com.banquethub.modules.ai.dto.*;
import com.banquethub.modules.ai.entity.AiRecommendationUsage;
import com.banquethub.modules.ai.repository.AiRecommendationUsageRepository;
import com.banquethub.modules.users.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Orchestrator service for AI Menu Recommendations.
 * Integrates Gemini API with real PostgreSQL inventory & recipe validation,
 * automated fallbacks, and rate limiting.
 */
@Service
public class AiRecommendationService {

    private static final Logger log = LoggerFactory.getLogger(AiRecommendationService.class);

    // Concurrency limiter to protect Gemini project quota (max 10 parallel outgoing requests)
    private static final Semaphore concurrentCallLimiter = new Semaphore(10);

    private final GeminiProperties geminiProperties;
    private final MenuCandidateService menuCandidateService;
    private final GeminiClientService geminiClientService;
    private final RecommendationValidationService validationService;
    private final RecommendationFallbackService fallbackService;
    private final AiRecommendationUsageRepository usageRepository;
    private final AiRateLimiterService rateLimiterService;

    public AiRecommendationService(
            GeminiProperties geminiProperties,
            MenuCandidateService menuCandidateService,
            GeminiClientService geminiClientService,
            RecommendationValidationService validationService,
            RecommendationFallbackService fallbackService,
            AiRecommendationUsageRepository usageRepository,
            AiRateLimiterService rateLimiterService
    ) {
        this.geminiProperties = geminiProperties;
        this.menuCandidateService = menuCandidateService;
        this.geminiClientService = geminiClientService;
        this.validationService = validationService;
        this.fallbackService = fallbackService;
        this.usageRepository = usageRepository;
        this.rateLimiterService = rateLimiterService;
    }

    public AiMenuRecommendationResponse getRecommendations(
            AiMenuRecommendationRequest request,
            User currentUser
    ) {
        long startTime = System.currentTimeMillis();
        UUID requestId = UUID.randomUUID();

        // 1. Atomic Rate Limiting Check & Reservation (per user per hour via PostgreSQL lock)
        AiRecommendationUsage usageRecord = null;
        if (currentUser != null && currentUser.getId() != null) {
            usageRecord = rateLimiterService.acquireUsageSlot(
                    currentUser.getId(),
                    geminiProperties.getModel(),
                    "GEMINI",
                    geminiProperties.getMaxRequestsPerHour()
            );
        }

        // 2. Query real candidate dishes with stock and recipe validation
        String effectiveExclusions;
        if (request.getExcludedIngredients() == null) {
            // Field omitted (e.g. raw prompt API call): extract from requestText
            List<String> extractedFromText = MenuCandidateService.extractExclusionPhrasesFromText(request.getRequestText());
            effectiveExclusions = extractedFromText.isEmpty() ? null : String.join(", ", extractedFromText);
        } else {
            // Caller explicitly provided the confirmed list of excluded ingredients (including empty string "").
            // Strictly respect the confirmed exclusions without re-extracting from requestText.
            effectiveExclusions = request.getExcludedIngredients().trim();
        }

        List<DishCandidateDto> candidates = menuCandidateService.getEligibleCandidates(effectiveExclusions, request.getTableCount());
        if (candidates.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Không tìm thấy món ăn phù hợp với yêu cầu loại trừ hoặc tồn kho hiện tại của nhà hàng."
            );
        }

        Set<Long> candidateIds = candidates.stream().map(DishCandidateDto::getId).collect(Collectors.toSet());
        List<String> excludedKeywords = MenuCandidateService.parseExcludedKeywords(effectiveExclusions);

        String source = "GEMINI";
        String message = "Gợi ý thực đơn thành công từ trợ lý AI BanquetHub.";
        List<MenuSuggestionDto> validatedSuggestions = null;

        int promptTokens = 0;
        int candidateTokens = 0;
        String errorMessage = null;

        // 3. Invoke Gemini AI if enabled
        if (geminiProperties.isEnabled() && geminiProperties.getApiKey() != null && !geminiProperties.getApiKey().isBlank()) {
            boolean permitAcquired = false;
            try {
                permitAcquired = concurrentCallLimiter.tryAcquire(2, TimeUnit.SECONDS);
                if (permitAcquired) {
                    GeminiClientService.GeminiCallResult callResult =
                            geminiClientService.callGemini(request, candidates);

                    promptTokens = callResult.promptTokens();
                    candidateTokens = callResult.outputTokens();

                    List<GeminiClientService.RawAiSuggestion> rawSuggestions =
                            callResult.suggestions() != null ? callResult.suggestions().suggestions() : null;

                    if (rawSuggestions != null && !rawSuggestions.isEmpty()) {
                        List<MenuSuggestionDto> validated = validationService.validateAndEnrichSuggestions(
                                rawSuggestions,
                                request,
                                candidateIds,
                                excludedKeywords
                        );

                        // Strict Feasibility Filter: Only accept suggestions that are fully AVAILABLE and WITHIN_BUDGET
                        List<MenuSuggestionDto> feasible = validated.stream()
                                .filter(s -> s.getAvailabilityStatus() == AvailabilityStatus.AVAILABLE
                                        && s.getBudgetStatus() != BudgetStatus.OVER_BUDGET)
                                .limit(3)
                                .toList();

                        if (!feasible.isEmpty()) {
                            validatedSuggestions = feasible;
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
            List<MenuSuggestionDto> fallbackRaw = fallbackService.generateFallbackSuggestions(request, candidates);
            validatedSuggestions = fallbackRaw.stream()
                    .filter(s -> s.getAvailabilityStatus() == AvailabilityStatus.AVAILABLE
                            && s.getBudgetStatus() != BudgetStatus.OVER_BUDGET)
                    .limit(3)
                    .toList();

            if (validatedSuggestions.isEmpty()) {
                validatedSuggestions = Collections.emptyList();
                message = "Không tìm thấy phương án thực đơn nào phù hợp với ngân sách hoặc tồn kho hiện tại của nhà hàng.";
            } else {
                message = "Gợi ý thực đơn tối ưu theo dữ liệu món ăn và kho thực tế của nhà hàng.";
            }
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
