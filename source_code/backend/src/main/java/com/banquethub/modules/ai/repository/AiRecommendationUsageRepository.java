package com.banquethub.modules.ai.repository;

import com.banquethub.modules.ai.entity.AiRecommendationUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;

@Repository
public interface AiRecommendationUsageRepository extends JpaRepository<AiRecommendationUsage, Long> {

    long countByUserIdAndCreatedAtAfter(Long userId, OffsetDateTime since);
}
