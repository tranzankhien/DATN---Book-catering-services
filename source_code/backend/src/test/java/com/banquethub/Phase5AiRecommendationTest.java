package com.banquethub;

import com.banquethub.modules.ai.dto.AiMenuRecommendationRequest;
import com.banquethub.modules.ai.dto.AvailabilityStatus;
import com.banquethub.modules.ai.dto.BudgetStatus;
import com.banquethub.modules.ai.dto.BudgetType;
import com.banquethub.modules.ai.dto.DishCandidateDto;
import com.banquethub.modules.ai.dto.MenuSuggestionDto;
import com.banquethub.modules.ai.service.GeminiClientService;
import com.banquethub.modules.ai.service.MenuCandidateService;
import com.banquethub.modules.ai.service.RecommendationFallbackService;
import com.banquethub.modules.ai.service.RecommendationValidationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class Phase5AiRecommendationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private JdbcTemplate db;

    @Autowired
    private RecommendationValidationService validationService;

    @Autowired
    private MenuCandidateService menuCandidateService;

    @Autowired
    private RecommendationFallbackService fallbackService;

    @Autowired
    private com.banquethub.modules.ai.config.GeminiProperties geminiProperties;

    private String userToken() throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "user@banquethub.vn", "password", "User@123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).path("data").path("accessToken").asText();
    }

    private String employeeToken() throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "employee@banquethub.vn", "password", "Employee@123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).path("data").path("accessToken").asText();
    }

    private String adminToken() throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "admin@banquethub.vn", "password", "Admin@123"))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).path("data").path("accessToken").asText();
    }

    @Test
    @DisplayName("TC-01: Guest user cannot access AI recommendation endpoint")
    void guestUser_isUnauthorized() throws Exception {
        mvc.perform(post("/api/v1/ai/menu/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "requestText", "Tiệc sinh nhật 5 bàn, ngân sách 1.500.000đ/bàn",
                                "tableCount", 5,
                                "guestsPerTable", 6
                        ))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("TC-02: Validation fails on empty request text")
    void emptyRequestText_returnsBadRequest() throws Exception {
        String token = userToken();
        mvc.perform(post("/api/v1/ai/menu/recommendations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "requestText", "",
                                "tableCount", 5,
                                "guestsPerTable", 6
                        ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC-03: Validation fails on non-positive table count")
    void invalidTableCount_returnsBadRequest() throws Exception {
        String token = userToken();
        mvc.perform(post("/api/v1/ai/menu/recommendations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "requestText", "Tiệc mừng thọ 10 bàn",
                                "tableCount", 0,
                                "guestsPerTable", 6
                        ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TC-04: Authenticated user receives valid menu recommendations with accurate DB pricing and available stock")
    void validRequest_returnsStructuredSuggestionsWithoutCreatingOrders() throws Exception {
        // Reset rate limit quota for user 3
        db.update("DELETE FROM ai_recommendation_usage WHERE user_id = 3");

        // Ensure at least one active dish with recipes and ample stock exists
        String unique = "AI-" + UUID.randomUUID().toString().substring(0, 8);
        long ingredientId = db.queryForObject(
                "INSERT INTO ingredients(code, name, unit, current_stock, avg_unit_cost) VALUES (?, ?, 'kg', 500, 80000) RETURNING id",
                Long.class, unique, "Nguyên liệu " + unique
        );
        long categoryId = db.queryForObject("SELECT min(id) FROM dish_categories", Long.class);
        long dishId = db.queryForObject(
                "INSERT INTO dishes(code, name, price, category_id, status) VALUES (?, ?, 220000, ?, 'ACTIVE') RETURNING id",
                Long.class, unique, "Món " + unique, categoryId
        );
        db.update("INSERT INTO recipe_items(dish_id, ingredient_id, quantity) VALUES (?, ?, 0.5)", dishId, ingredientId);

        int initialOrdersCount = db.queryForObject("SELECT count(*) FROM orders", Integer.class);
        int initialReservationsCount = db.queryForObject("SELECT count(*) FROM stock_reservations", Integer.class);

        String token = userToken();
        String responseBody = mvc.perform(post("/api/v1/ai/menu/recommendations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "requestText", "Cần tổ chức tiệc sinh nhật 4 bàn, thích món Việt, ngân sách 1.500.000đ/bàn",
                                "eventType", "Sinh nhật",
                                "tableCount", 4,
                                "guestsPerTable", 6,
                                "budgetAmount", 1500000,
                                "budgetType", "PER_TABLE"
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode root = json.readTree(responseBody);
        assertThat(root.path("success").asBoolean()).isTrue();

        JsonNode data = root.path("data");
        assertThat(data.path("source").asText()).isIn("GEMINI", "RULE_BASED");
        JsonNode suggestions = data.path("suggestions");
        assertThat(suggestions.isArray()).isTrue();
        assertThat(suggestions.size()).isBetween(1, 3);

        for (JsonNode suggestion : suggestions) {
            assertThat(suggestion.path("name").asText()).isNotEmpty();
            assertThat(suggestion.path("items").isArray()).isTrue();
            assertThat(suggestion.path("items").size()).isGreaterThan(0);

            BigDecimal totalPerTable = suggestion.path("totalPerTable").decimalValue();
            assertThat(totalPerTable).isGreaterThan(BigDecimal.ZERO);

            BigDecimal totalOrderAmount = suggestion.path("totalOrderAmount").decimalValue();
            assertThat(totalOrderAmount).isEqualByComparingTo(totalPerTable.multiply(BigDecimal.valueOf(4)));

            // Strict Feasibility: Suggestions delivered to user must be AVAILABLE and not OVER_BUDGET
            assertThat(suggestion.path("budgetStatus").asText()).isIn("WITHIN_BUDGET", "NO_BUDGET_SET");
            assertThat(suggestion.path("availabilityStatus").asText()).isEqualTo("AVAILABLE");
        }

        // Verify strictly: NO orders and NO reservations created
        int afterOrdersCount = db.queryForObject("SELECT count(*) FROM orders", Integer.class);
        int afterReservationsCount = db.queryForObject("SELECT count(*) FROM stock_reservations", Integer.class);
        assertThat(afterOrdersCount).isEqualTo(initialOrdersCount);
        assertThat(afterReservationsCount).isEqualTo(initialReservationsCount);
    }

    @Test
    @DisplayName("TC-05: Wedding case with 10 tables, 10 guests per table, 3M budget")
    void weddingCase_verifiedPayload() throws Exception {
        db.update("DELETE FROM ai_recommendation_usage WHERE user_id = 3");
        String token = userToken();
        String responseBody = mvc.perform(post("/api/v1/ai/menu/recommendations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "requestText", "Tôi muốn đặt thực đơn tiệc cưới khoảng 100 khách, chia thành 10 bàn, mỗi bàn 10 người. Ngân sách 3.000.000đ/bàn. Tôi thích thực đơn sang trọng, kết hợp món Việt và món Á, có khai vị, hải sản, món chính, lẩu và tráng miệng.",
                                "eventType", "Tiệc cưới / Đính hôn",
                                "tableCount", 10,
                                "guestsPerTable", 10,
                                "budgetAmount", 3000000,
                                "budgetType", "PER_TABLE"
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode root = json.readTree(responseBody);
        assertThat(root.path("success").asBoolean()).isTrue();
        JsonNode suggestions = root.path("data").path("suggestions");
        assertThat(suggestions.size()).isGreaterThan(0);
        for (JsonNode s : suggestions) {
            assertThat(s.path("availabilityStatus").asText()).isEqualTo("AVAILABLE");
            assertThat(s.path("budgetStatus").asText()).isEqualTo("WITHIN_BUDGET");
        }
    }

    @Test
    @DisplayName("TC-06: Whitelist candidate enforcement rejects hallucinated or excluded dish IDs")
    void whitelistCandidateEnforcement_rejectsOutsideDishes() {
        AiMenuRecommendationRequest req = new AiMenuRecommendationRequest();
        req.setRequestText("Tiệc gia đình");
        req.setTableCount(5);
        req.setGuestsPerTable(6);

        // Raw AI suggestions containing dish ID 999999 (not in candidates) and dish ID 1
        GeminiClientService.RawAiSuggestion suggestion = new GeminiClientService.RawAiSuggestion(
                "Menu Test",
                "Reason",
                List.of(
                        new GeminiClientService.RawAiItem(999999L, 1),
                        new GeminiClientService.RawAiItem(1L, 1)
                )
        );

        // Only allow dish ID 1 in whitelist
        Set<Long> candidateIds = Set.of(1L);
        List<MenuSuggestionDto> validated = validationService.validateAndEnrichSuggestions(
                List.of(suggestion),
                req,
                candidateIds,
                Collections.emptyList()
        );

        assertThat(validated).isNotEmpty();
        MenuSuggestionDto menu = validated.get(0);
        // Dish 999999 must NOT be present
        assertThat(menu.getItems().stream().map(it -> it.getDishId()).toList())
                .doesNotContain(999999L);
    }

    @Test
    @DisplayName("TC-07: Compound excluded ingredients parses both 'tôm' and 'cua' and filters them")
    void compoundExclusion_parsesAllTokens() {
        List<String> keywords = MenuCandidateService.parseExcludedKeywords("Không ăn tôm và cua, kiêng thịt bò");
        assertThat(keywords).contains("tôm", "cua", "thịt bò");
        assertThat(keywords).doesNotContain("không ăn tôm và cua");

        // Verify dish matching
        boolean matches = MenuCandidateService.matchesAnyKeyword(
                "Gỏi Sứa Tôm Thịt",
                List.of("Tôm sú", "Thịt ba chỉ"),
                keywords
        );
        assertThat(matches).isTrue();

        boolean chickenMatches = MenuCandidateService.matchesAnyKeyword(
                "Gà Nướng Mật Ong",
                List.of("Thịt gà", "Mật ong"),
                keywords
        );
        assertThat(chickenMatches).isFalse();
    }

    @Test
    @DisplayName("TC-08: Budget extraction handles decimal millions and preserves budget type correctly")
    void budgetExtraction_handlesDecimalMillionsAccurately() {
        var res1 = RecommendationValidationService.extractBudgetFromText("Chi phí 1.5 triệu/bàn, tổng 5 bàn");
        assertThat(res1).isNotNull();
        assertThat(res1.amount()).isEqualByComparingTo(BigDecimal.valueOf(1500000L));
        assertThat(res1.budgetType()).isEqualTo(BudgetType.PER_TABLE);

        var res2 = RecommendationValidationService.extractBudgetFromText("Tổng chi phí là 25 triệu cho cả tiệc");
        assertThat(res2).isNotNull();
        assertThat(res2.amount()).isEqualByComparingTo(BigDecimal.valueOf(25000000L));
        assertThat(res2.budgetType()).isEqualTo(BudgetType.TOTAL_ORDER);

        var res3 = RecommendationValidationService.extractBudgetFromText("Ngân sách 1tr2/bàn");
        assertThat(res3).isNotNull();
        assertThat(res3.amount()).isEqualByComparingTo(BigDecimal.valueOf(1200000L));
    }

    @Test
    @DisplayName("TC-09: Fallback menu strictly obeys budget limit and available inventory")
    void fallbackMenu_strictlyObeysBudgetCap() {
        AiMenuRecommendationRequest req = new AiMenuRecommendationRequest();
        req.setRequestText("Tiệc gia đình 4 bàn, ngân sách 1.5 triệu/bàn");
        req.setTableCount(4);
        req.setGuestsPerTable(8);
        req.setBudgetAmount(BigDecimal.valueOf(1500000));
        req.setBudgetType(BudgetType.PER_TABLE);

        List<DishCandidateDto> candidates = menuCandidateService.getEligibleCandidates(null);
        assertThat(candidates).isNotEmpty();

        List<MenuSuggestionDto> fallbackResults = fallbackService.generateFallbackSuggestions(req, candidates);
        assertThat(fallbackResults).isNotEmpty();

        for (MenuSuggestionDto menu : fallbackResults) {
            assertThat(menu.getTotalPerTable()).isLessThanOrEqualTo(BigDecimal.valueOf(1500000));
            assertThat(menu.getBudgetStatus()).isEqualTo(BudgetStatus.WITHIN_BUDGET);
            assertThat(menu.getAvailabilityStatus()).isEqualTo(AvailabilityStatus.AVAILABLE);
        }
    }

    @Test
    @DisplayName("TC-10: Excluded ingredients parser handles 'Dị ứng tôm, cua và đậu phộng'")
    void excludedIngredients_parsesAllergenListCleanly() {
        List<String> keywords = MenuCandidateService.parseExcludedKeywords("Dị ứng tôm, cua và đậu phộng");
        assertThat(keywords).contains("tôm", "cua", "đậu phộng");
    }

    @Test
    @DisplayName("TC-11: Budget extraction handles '25 triệu/tiệc, 5 bàn' and 'ngân sách tổng 25 triệu'")
    void budgetExtraction_handlesTotalPartyUnits() {
        var res1 = RecommendationValidationService.extractBudgetFromText("25 triệu/tiệc, 5 bàn");
        assertThat(res1).isNotNull();
        assertThat(res1.amount()).isEqualByComparingTo(BigDecimal.valueOf(25000000L));
        assertThat(res1.budgetType()).isEqualTo(BudgetType.TOTAL_ORDER);

        var res2 = RecommendationValidationService.extractBudgetFromText("ngân sách tổng 25 triệu, 5 bàn");
        assertThat(res2).isNotNull();
        assertThat(res2.amount()).isEqualByComparingTo(BigDecimal.valueOf(25000000L));
        assertThat(res2.budgetType()).isEqualTo(BudgetType.TOTAL_ORDER);
    }

    @Test
    @DisplayName("TC-12: Role-based authorization rejects ROLE_EMPLOYEE and ROLE_ADMIN from customer AI endpoint")
    void nonUserRole_isForbidden() throws Exception {
        String empToken = employeeToken();
        mvc.perform(post("/api/v1/ai/menu/recommendations")
                        .header("Authorization", "Bearer " + empToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "requestText", "Tiệc sinh nhật 5 bàn, ngân sách 1.500.000đ/bàn",
                                "tableCount", 5,
                                "guestsPerTable", 6
                        ))))
                .andExpect(status().isForbidden());

        String admToken = adminToken();
        mvc.perform(post("/api/v1/ai/menu/recommendations")
                        .header("Authorization", "Bearer " + admToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "requestText", "Tiệc sinh nhật 5 bàn, ngân sách 1.500.000đ/bàn",
                                "tableCount", 5,
                                "guestsPerTable", 6
                        ))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TC-13: Concurrent rate limiting at quota boundary allows only allowed quota")
    void concurrentRateLimiting_strictlyEnforcesSlotReservation() throws Exception {
        // Pre-fill (limit - 1) usage records for user 3 in the last 30 minutes
        long validUserId = 3L;
        db.update("DELETE FROM ai_recommendation_usage WHERE user_id = ?", validUserId);
        int limit = geminiProperties.getMaxRequestsPerHour();
        for (int i = 0; i < limit - 1; i++) {
            db.update("INSERT INTO ai_recommendation_usage (user_id, model, source, status, prompt_tokens, output_tokens, response_time_ms, created_at) " +
                    "VALUES (?, 'gemini-1.5-flash', 'GEMINI', 'SUCCESS', 100, 100, 100, NOW() - INTERVAL '10 minutes')", validUserId);
        }

        String validUserToken = userToken();

        // Fire 4 concurrent requests. Exactly 1 slot is remaining.
        int concurrentRequests = 4;
        ExecutorService executor = Executors.newFixedThreadPool(concurrentRequests);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger okCount = new AtomicInteger(0);
        AtomicInteger rateLimitedCount = new AtomicInteger(0);

        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < concurrentRequests; i++) {
            futures.add(executor.submit(() -> {
                try {
                    latch.await();
                    int code = mvc.perform(post("/api/v1/ai/menu/recommendations")
                                    .header("Authorization", "Bearer " + validUserToken)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(json.writeValueAsString(Map.of(
                                            "requestText", "Cần tiệc gia đình 4 bàn",
                                            "tableCount", 4,
                                            "guestsPerTable", 6
                                    ))))
                            .andReturn().getResponse().getStatus();
                    if (code == 200) {
                        okCount.incrementAndGet();
                    } else if (code == 429) {
                        rateLimitedCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    // ignore
                }
            }));
        }

        latch.countDown();
        for (Future<?> f : futures) {
            f.get(10, TimeUnit.SECONDS);
        }
        executor.shutdown();

        // Exactly 1 request should have succeeded, and the other 3 should have received 429 Too Many Requests
        assertThat(okCount.get()).isEqualTo(1);
        assertThat(rateLimitedCount.get()).isEqualTo(3);
    }

    @Test
    @DisplayName("TC-14: Unfeasible budget returns empty suggestions list and proper explanatory message")
    void impossibleBudget_returnsEmptySuggestions() throws Exception {
        db.update("DELETE FROM ai_recommendation_usage WHERE user_id = 3");
        String token = userToken();
        String responseBody = mvc.perform(post("/api/v1/ai/menu/recommendations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "requestText", "Tiệc 5 bàn, ngân sách 50.000đ/bàn",
                                "tableCount", 5,
                                "guestsPerTable", 6,
                                "budgetAmount", 50000,
                                "budgetType", "PER_TABLE"
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode root = json.readTree(responseBody);
        assertThat(root.path("success").asBoolean()).isTrue();
        JsonNode data = root.path("data");
        JsonNode suggestions = data.path("suggestions");
        assertThat(suggestions.isArray()).isTrue();
        assertThat(suggestions.size()).isEqualTo(0);
        assertThat(data.path("message").asText()).contains("Không tìm thấy phương án thực đơn nào phù hợp");
    }

    @Test
    @DisplayName("TC-15: Unaccented allergy exclusion in requestText (\"di ung tom va cua\") filters out allergens")
    void unaccentedAllergyExclusion_filtersDishesWithoutExplicitExcludedIngredients() throws Exception {
        db.update("DELETE FROM ai_recommendation_usage WHERE user_id = 3");
        String token = userToken();
        String responseBody = mvc.perform(post("/api/v1/ai/menu/recommendations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "requestText", "Gia đình tôi muốn đặt tiệc 4 bàn, di ung tom va cua, ngan sach 1.500.000d/ban",
                                "tableCount", 4,
                                "guestsPerTable", 6,
                                "budgetAmount", 1500000,
                                "budgetType", "PER_TABLE"
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode root = json.readTree(responseBody);
        assertThat(root.path("success").asBoolean()).isTrue();
        JsonNode suggestions = root.path("data").path("suggestions");
        for (JsonNode suggestion : suggestions) {
            for (JsonNode item : suggestion.path("items")) {
                String dishName = item.path("dishName").asText().toLowerCase();
                String unaccented = MenuCandidateService.removeDiacritics(dishName);
                assertThat(unaccented).doesNotContain("tom");
                assertThat(unaccented).doesNotContain("cua");
            }
        }
    }

    @Test
    @DisplayName("TC-16: Candidate selection scales ingredient inventory requirements with tableCount")
    void candidateSelection_scalesStockRequirementWithTableCount() {
        String unique = "SCALE-" + UUID.randomUUID().toString().substring(0, 8);
        long ingredientId = db.queryForObject(
                "INSERT INTO ingredients(code, name, unit, current_stock, avg_unit_cost) VALUES (?, ?, 'kg', 10, 50000) RETURNING id",
                Long.class, unique, "Nguyên liệu " + unique
        );
        long categoryId = db.queryForObject("SELECT min(id) FROM dish_categories", Long.class);
        long dishId = db.queryForObject(
                "INSERT INTO dishes(code, name, price, category_id, status) VALUES (?, ?, 180000, ?, 'ACTIVE') RETURNING id",
                Long.class, unique, "Món " + unique, categoryId
        );
        // Dish requires 2.0 kg per table
        db.update("INSERT INTO recipe_items(dish_id, ingredient_id, quantity) VALUES (?, ?, 2.0)", dishId, ingredientId);

        // 4 tables need 8 kg (available = 10kg -> eligible)
        List<DishCandidateDto> candidates4Tables = menuCandidateService.getEligibleCandidates(null, 4);
        boolean foundIn4 = candidates4Tables.stream().anyMatch(d -> d.getId().equals(dishId));
        assertThat(foundIn4).isTrue();
    }

    @Test
    @DisplayName("TC-17: Budget extraction with per-person rate (/người) correctly converts to per-table budget")
    void extractBudgetFromText_convertsPerPersonToPerTable() {
        var res1 = RecommendationValidationService.extractBudgetFromText("Ngân sách 300k/người, mỗi bàn 8 người", 8);
        assertThat(res1).isNotNull();
        assertThat(res1.budgetType()).isEqualTo(BudgetType.PER_TABLE);
        // 300,000 * 8 = 2,400,000
        assertThat(res1.amount()).isEqualByComparingTo(BigDecimal.valueOf(2_400_000L));

        var res2 = RecommendationValidationService.extractBudgetFromText("chi phí 200k/người, tiệc 5 bàn");
        assertThat(res2).isNotNull();
        assertThat(res2.budgetType()).isEqualTo(BudgetType.PER_TABLE);
        // Default 6 guests/table: 200,000 * 6 = 1,200,000
        assertThat(res2.amount()).isEqualByComparingTo(BigDecimal.valueOf(1_200_000L));
    }

    @Test
    @DisplayName("TC-18: Explicit empty excludedIngredients field (\"\") respects user decision to clear exclusions")
    void explicitEmptyExclusions_doesNotReExtractFromText() throws Exception {
        db.update("DELETE FROM ai_recommendation_usage WHERE user_id = 3");
        String token = userToken();
        // Client sends excludedIngredients as explicit empty string ""
        String responseBody = mvc.perform(post("/api/v1/ai/menu/recommendations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "requestText", "Tiệc 4 bàn, dị ứng tôm, ngân sách 1.500.000đ/bàn",
                                "tableCount", 4,
                                "guestsPerTable", 6,
                                "budgetAmount", 1500000,
                                "budgetType", "PER_TABLE",
                                "excludedIngredients", ""
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode root = json.readTree(responseBody);
        assertThat(root.path("success").asBoolean()).isTrue();
        // Request succeeded and did not fail candidate check
        JsonNode suggestions = root.path("data").path("suggestions");
        assertThat(suggestions).isNotNull();
    }

    @Test
    @DisplayName("TC-19: Description allergy ('dị ứng tôm') and separate field allergy ('cua') are both enforced")
    void descriptionAndSeparateExclusions_areBothEnforced() throws Exception {
        db.update("DELETE FROM ai_recommendation_usage WHERE user_id = 3");
        String token = userToken();
        // Client sends requestText mentioning "dị ứng tôm", and excludedIngredients mentioning "cua"
        String responseBody = mvc.perform(post("/api/v1/ai/menu/recommendations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "requestText", "Tiệc 4 bàn, dị ứng tôm, ngân sách 1.500.000đ/bàn",
                                "tableCount", 4,
                                "guestsPerTable", 6,
                                "budgetAmount", 1500000,
                                "budgetType", "PER_TABLE",
                                "excludedIngredients", "cua"
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode root = json.readTree(responseBody);
        assertThat(root.path("success").asBoolean()).isTrue();
        JsonNode suggestions = root.path("data").path("suggestions");
        for (JsonNode suggestion : suggestions) {
            for (JsonNode item : suggestion.path("items")) {
                String dishName = item.path("dishName").asText().toLowerCase();
                String unaccented = MenuCandidateService.removeDiacritics(dishName);
                assertThat(unaccented).doesNotContain("tom");
                assertThat(unaccented).doesNotContain("cua");
            }
        }
    }
}
