-- Phase 5: AI Menu Recommendation System - Usage & Audit Log Table
CREATE TABLE IF NOT EXISTS ai_recommendation_usage (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,
    source VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    prompt_tokens INTEGER,
    output_tokens INTEGER,
    response_time_ms BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created ON ai_recommendation_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_source ON ai_recommendation_usage(source);
