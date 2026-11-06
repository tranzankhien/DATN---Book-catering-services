# AI Menu Recommendation Architecture (Phase 5)

## 1. Overview
The BanquetHub AI Menu Recommendation module enables registered customers to receive personalized banquet menu proposals using natural language prompts while enforcing strict transactional safety, authentic PostgreSQL price authority, and live inventory stock verification.

```
[ User Request (/ai-menu) ]
          │
          ▼
[ POST /api/v1/ai/menu/recommendations (Auth: Bearer JWT) ]
          │
          ├──> 1. Rate Limiting Check (Default 10 requests / user / hour)
          │
          ├──> 2. Query Active Candidate Dishes from PostgreSQL (with Recipes)
          │       • Filter out excluded ingredients / allergens
          │
          ├──> 3. Google Gemini API Call (Structured Output via responseSchema)
          │       • Model: gemini-flash-lite-latest (or configured model)
          │       • System Instruction & strict JSON Schema
          │
          ├──> 4. Failover & Resilience (RecommendationFallbackService)
          │       • Engaged on timeout, 503 high demand, rate limits, or disabled API
          │       • Generates 3 culinary-balanced proposals (Tiết kiệm, Hài hòa, Thịnh soạn)
          │
          ├──> 5. Backend Price & Stock Verification (RecommendationValidationService)
          │       • DB Price Authority: Overrides all prices with dish.price
          │       • Demand calculation: portionQty * tableCount * recipe.quantity
          │       • Available stock check: physicalStock - activeReservedStock
          │       • Budget status: WITHIN_BUDGET vs OVER_BUDGET
          │       • Stock status: AVAILABLE, PARTIAL_SHORTAGE, OUT_OF_STOCK
          │       • ZERO order creation, ZERO stock deductions, ZERO auto-reservations
          │
          ├──> 6. Technical Audit Log (ai_recommendation_usage)
          │       • Tracks tokens, latency, status (SUCCESS/FALLBACK), model
          │
          ▼
[ Clean Frontend Showcase Card (/ai-menu) ]
          │
          ▼
[ User clicks "Chọn thực đơn này & Tùy biến" ]
          │
          ▼
[ Transfers to Menu Builder (/menu-builder) -> Standard Phase 3 & 4 Workflow ]
```

## 2. Security & Boundaries
1. **Zero Hallucinated Prices**: Gemini outputs only `{ dishId, quantityPerTable }`. Prices are pulled directly from the `dishes` table in PostgreSQL.
2. **Zero Auto-Orders / Auto-Reservations**: AI recommendations are strictly advisory read-only proposals. Stock reservations occur only when the customer formally initiates an order at checkout.
3. **Independent Stock Validation**: Stock availability is evaluated independently for each candidate menu without compounding demands across proposals.
4. **Data Privacy**: No customer personal identifying information (PII) is sent to Gemini.
5. **Rate Limiting**: Configurable limit (`app.gemini.max-requests-per-hour`, default: 10/hour) tracked per user in `ai_recommendation_usage`.

## 3. Database Schema
Defined in `backend/src/main/resources/db/migration/V15__ai_recommendation_usage.sql`:
- `ai_recommendation_usage`:
  - `id`: Primary key (BIGSERIAL)
  - `user_id`: Foreign key referencing `users(id)`
  - `model`: AI model identifier (e.g. `gemini-flash-lite-latest`)
  - `source`: `"GEMINI"` or `"RULE_BASED"`
  - `status`: `"SUCCESS"` or `"FALLBACK"`
  - `prompt_tokens`: Prompt token count
  - `output_tokens`: Output token count
  - `response_time_ms`: Backend processing latency in milliseconds
  - `created_at`: Timestamp with time zone
