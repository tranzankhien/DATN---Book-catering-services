package com.banquethub.modules.ai.service;

import com.banquethub.modules.ai.entity.AiRecommendationUsage;
import com.banquethub.modules.ai.repository.AiRecommendationUsageRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;

/**
 * Atomic Rate Limiter service leveraging PostgreSQL advisory transaction locks
 * to strictly serialize usage slots per user across any thread or application instance.
 */
@Service
public class AiRateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(AiRateLimiterService.class);

    @PersistenceContext
    private EntityManager entityManager;

    private final AiRecommendationUsageRepository usageRepository;

    public AiRateLimiterService(AiRecommendationUsageRepository usageRepository) {
        this.usageRepository = usageRepository;
    }

    /**
     * Atomically acquires a rate-limit usage slot for the user.
     * Uses pg_advisory_xact_lock on a hash of the user ID, ensuring serial execution for this user.
     * Throws TOO_MANY_REQUESTS (429) if user exceeds maxPerHour.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AiRecommendationUsage acquireUsageSlot(Long userId, String model, String provider, int maxPerHour) {
        if (userId == null) {
            return null;
        }

        // 1. Transaction-scoped PostgreSQL advisory lock hashed on userId
        try {
            entityManager.createNativeQuery(
                    "SELECT pg_advisory_xact_lock(CAST(hashtext('ai_rate_limit:' || :uid) AS BIGINT))"
            ).setParameter("uid", String.valueOf(userId)).getSingleResult();
        } catch (Exception e) {
            log.warn("Could not acquire advisory lock for userId {}: {}", userId, e.getMessage());
        }

        // 2. Count active usages within the past 1 hour
        OffsetDateTime oneHourAgo = OffsetDateTime.now().minusHours(1);
        long recentCalls = usageRepository.countByUserIdAndCreatedAtAfter(userId, oneHourAgo);
        if (recentCalls >= maxPerHour) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Bạn đã sử dụng tối đa " + maxPerHour +
                            " lượt gợi ý thực đơn trong 1 giờ. Vui lòng quay lại sau ít phút hoặc tự phối thực đơn."
            );
        }

        // 3. Atomically persist slot reservation
        AiRecommendationUsage usage = new AiRecommendationUsage(
                userId,
                model,
                provider,
                "STARTED",
                0,
                0,
                0L
        );
        return usageRepository.saveAndFlush(usage);
    }
}
