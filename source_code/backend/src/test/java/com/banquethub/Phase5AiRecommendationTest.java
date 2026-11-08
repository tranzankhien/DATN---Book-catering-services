package com.banquethub;

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
import java.util.Map;
import java.util.UUID;

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

    private String userToken() throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "user@banquethub.vn", "password", "User@123"))))
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
    @DisplayName("TC-04: Authenticated user receives valid menu recommendations with accurate DB pricing and stock check")
    void validRequest_returnsStructuredSuggestionsWithoutCreatingOrders() throws Exception {
        // Ensure at least one active dish with recipes exists
        String unique = "AI-" + UUID.randomUUID().toString().substring(0, 8);
        long ingredientId = db.queryForObject(
                "INSERT INTO ingredients(code, name, unit, current_stock, avg_unit_cost) VALUES (?, ?, 'kg', 50, 80000) RETURNING id",
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
                                "requestText", "Cần tổ chức tiệc sinh nhật 4 bàn, thích món Việt, ngân sách 1.200.000đ/bàn",
                                "eventType", "Sinh nhật",
                                "tableCount", 4,
                                "guestsPerTable", 6,
                                "budgetAmount", 1200000,
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

            assertThat(suggestion.path("budgetStatus").asText()).isIn("WITHIN_BUDGET", "OVER_BUDGET");
            assertThat(suggestion.path("availabilityStatus").asText()).isIn("AVAILABLE", "PARTIAL_SHORTAGE", "OUT_OF_STOCK");
        }

        // Verify strictly: NO orders and NO reservations created
        int afterOrdersCount = db.queryForObject("SELECT count(*) FROM orders", Integer.class);
        int afterReservationsCount = db.queryForObject("SELECT count(*) FROM stock_reservations", Integer.class);
        assertThat(afterOrdersCount).isEqualTo(initialOrdersCount);
        assertThat(afterReservationsCount).isEqualTo(initialReservationsCount);
    }

    @Test
    @DisplayName("TC-05: Reproduce user wedding case with 10 tables, 30 guests per table, 3M budget")
    void weddingCase_reproduceIssue() throws Exception {
        String token = userToken();
        String responseBody = mvc.perform(post("/api/v1/ai/menu/recommendations")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "requestText", "Tôi muốn đặt thực đơn tiệc cưới khoảng 100 khách, chia thành 10 bàn, mỗi bàn 10 người. Ngân sách 3.000.000đ/bàn. Tôi thích thực đơn sang trọng, kết hợp món Việt và món Á, có khai vị, hải sản, món chính, lẩu và tráng miệng.",
                                "eventType", "Tiệc cưới / Đính hôn",
                                "tableCount", 10,
                                "guestsPerTable", 30,
                                "budgetAmount", 3000000,
                                "budgetType", "PER_TABLE"
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode root = json.readTree(responseBody);
        assertThat(root.path("success").asBoolean()).isTrue();
    }
}
