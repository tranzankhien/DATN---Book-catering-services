package com.banquethub;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Phase1IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Order(1)
    @DisplayName("1. Health check endpoint trả kết quả UP và kết nối PostgreSQL thành công")
    void healthEndpointsShouldReturnUp() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"))
                .andExpect(jsonPath("$.data.database").value("PostgreSQL Connected"));

        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @Order(2)
    @DisplayName("2. Guest xem được danh mục và tối thiểu 10 món ăn công khai không cần đăng nhập (AT-01)")
    void guestCanViewPublicCatalogAndDishDetail() throws Exception {
        mockMvc.perform(get("/api/v1/catalog/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(5))));

        MvcResult dishesResult = mockMvc.perform(get("/api/v1/catalog/dishes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(10))))
                .andReturn();

        JsonNode root = objectMapper.readTree(dishesResult.getResponse().getContentAsString());
        long firstDishId = root.path("data").get(0).path("id").asLong();

        mockMvc.perform(get("/api/v1/catalog/dishes/{id}", firstDishId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(firstDishId))
                .andExpect(jsonPath("$.data.recipeItems", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @Order(3)
    @DisplayName("3. Guest bị chặn (401) khi truy cập API Admin (AT-01)")
    void guestCannotAccessAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/catalog/dishes"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @Order(4)
    @Transactional
    @DisplayName("4. Đăng ký User mới, đăng nhập thành công và lấy thông tin /auth/me (AT-02)")
    void userRegistrationAndLoginShouldSucceed() throws Exception {
        String registerPayload = """
                {
                  "fullName": "Trần Thanh Tùng",
                  "email": "tung.tran.test@banquethub.vn",
                  "password": "Password@123",
                  "phone": "0988112233"
                }
                """;

        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.user.email").value("tung.tran.test@banquethub.vn"))
                .andExpect(jsonPath("$.data.user.role").value("ROLE_USER"))
                .andReturn();

        String loginPayload = """
                {
                  "email": "tung.tran.test@banquethub.vn",
                  "password": "Password@123"
                }
                """;

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andReturn();

        String userToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("tung.tran.test@banquethub.vn"))
                .andExpect(jsonPath("$.data.role").value("ROLE_USER"));

        // ROLE_USER bị chặn (403 Forbidden) khi gọi API Admin
        mockMvc.perform(get("/api/v1/admin/catalog/dishes")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @Order(5)
    @DisplayName("5. Đăng nhập sai mật khẩu bị từ chối với mã 401 Unauthorized")
    void loginWithWrongPasswordShouldBeRejected() throws Exception {
        String wrongLoginPayload = """
                {
                  "email": "user@banquethub.vn",
                  "password": "WrongPassword999!"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wrongLoginPayload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @Order(6)
    @Transactional
    @DisplayName("6. Admin tạo món mới, cấu hình công thức 2 nguyên liệu và ẩn/hiện món thành công (AT-03)")
    void adminCanCreateDishAndConfigureRecipe() throws Exception {
        String adminToken = obtainAdminToken();

        // Lấy danh sách danh mục và nguyên liệu để lấy ID hợp lệ
        MvcResult catRes = mockMvc.perform(get("/api/v1/admin/catalog/categories")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        long categoryId = objectMapper.readTree(catRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        MvcResult ingRes = mockMvc.perform(get("/api/v1/admin/catalog/ingredients")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(10))))
                .andReturn();
        JsonNode ingredients = objectMapper.readTree(ingRes.getResponse().getContentAsString()).path("data");
        long ing1Id = ingredients.get(0).path("id").asLong();
        long ing2Id = ingredients.get(1).path("id").asLong();

        String createDishPayload = """
                {
                  "code": "DISH-TEST-99",
                  "name": "Bào Ngư Vi Cá Sốt Hoàng Kim",
                  "description": "Món thử nghiệm tạo mới từ Admin kèm 2 nguyên liệu",
                  "imageUrl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
                  "price": 650000,
                  "categoryId": %d,
                  "status": "ACTIVE",
                  "recipeItems": [
                    { "ingredientId": %d, "quantity": 0.500, "note": "Sơ chế sạch" },
                    { "ingredientId": %d, "quantity": 0.250, "note": "Thái lát" }
                  ]
                }
                """.formatted(categoryId, ing1Id, ing2Id);

        MvcResult createdDishRes = mockMvc.perform(post("/api/v1/admin/catalog/dishes")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createDishPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("DISH-TEST-99"))
                .andExpect(jsonPath("$.data.recipeItems", hasSize(2)))
                .andReturn();

        long createdDishId = objectMapper.readTree(createdDishRes.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Cập nhật lại định lượng công thức
        String updateRecipePayload = """
                {
                  "recipeItems": [
                    { "ingredientId": %d, "quantity": 0.650, "note": "Tăng định lượng phần lớn" },
                    { "ingredientId": %d, "quantity": 0.300, "note": "Cập nhật định lượng" }
                  ]
                }
                """.formatted(ing1Id, ing2Id);

        mockMvc.perform(put("/api/v1/admin/catalog/dishes/{id}/recipe", createdDishId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRecipePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recipeItems", hasSize(2)));

        // Ẩn món ăn (status = HIDDEN) -> không còn xuất hiện ở API chi tiết công khai
        mockMvc.perform(patch("/api/v1/admin/catalog/dishes/{id}/status", createdDishId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"HIDDEN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("HIDDEN"));

        mockMvc.perform(get("/api/v1/catalog/dishes/{id}", createdDishId))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(7)
    @Transactional
    @DisplayName("7. Không lưu được công thức có định lượng âm hoặc bằng 0 (AT-03)")
    void adminCannotSaveZeroOrNegativeRecipeQuantity() throws Exception {
        String adminToken = obtainAdminToken();

        MvcResult dishesRes = mockMvc.perform(get("/api/v1/admin/catalog/dishes")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode dishes = objectMapper.readTree(dishesRes.getResponse().getContentAsString()).path("data");
        long dishId = dishes.get(0).path("id").asLong();
        long ingredientId = dishes.get(0).path("recipeItems").get(0).path("ingredientId").asLong();

        // Định lượng = 0 -> bị từ chối 400 Bad Request
        String zeroQtyPayload = """
                {
                  "recipeItems": [
                    { "ingredientId": %d, "quantity": 0, "note": "Định lượng bằng 0 không hợp lệ" }
                  ]
                }
                """.formatted(ingredientId);

        mockMvc.perform(put("/api/v1/admin/catalog/dishes/{id}/recipe", dishId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(zeroQtyPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        // Định lượng âm (-0.25) -> bị từ chối 400 Bad Request
        String negativeQtyPayload = """
                {
                  "recipeItems": [
                    { "ingredientId": %d, "quantity": -0.25, "note": "Định lượng âm không hợp lệ" }
                  ]
                }
                """.formatted(ingredientId);

        mockMvc.perform(put("/api/v1/admin/catalog/dishes/{id}/recipe", dishId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(negativeQtyPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        // Danh sách công thức chứa phần tử null -> bị từ chối 400 Bad Request (không phải 500)
        String nullRowPayload = """
                {
                  "recipeItems": [ null ]
                }
                """;

        mockMvc.perform(put("/api/v1/admin/catalog/dishes/{id}/recipe", dishId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nullRowPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(8)
    @Transactional
    @DisplayName("8. Chặn tạo món chưa có công thức và khóa đổi đơn vị nguyên liệu đang dùng trong công thức")
    void adminCannotCreateDishWithoutRecipeOrChangeUsedIngredientUnit() throws Exception {
        String adminToken = obtainAdminToken();

        MvcResult catRes = mockMvc.perform(get("/api/v1/admin/catalog/categories")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        long categoryId = objectMapper.readTree(catRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        // 1. Tạo món không có công thức (recipeItems rỗng) -> 400 Bad Request
        String noRecipePayload = """
                {
                  "code": "DISH-NO-RECIPE",
                  "name": "Món Không Có Công Thức",
                  "price": 12500,
                  "categoryId": %d,
                  "status": "ACTIVE",
                  "recipeItems": []
                }
                """.formatted(categoryId);

        mockMvc.perform(post("/api/v1/admin/catalog/dishes")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(noRecipePayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        // 2. Đổi đơn vị tính (unit) của nguyên liệu đã dùng trong công thức (từ kg sang g) -> 400 Bad Request
        MvcResult ingRes = mockMvc.perform(get("/api/v1/admin/catalog/ingredients")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode ingredients = objectMapper.readTree(ingRes.getResponse().getContentAsString()).path("data");
        JsonNode usedIngredient = null;
        for (JsonNode node : ingredients) {
            if (node.path("usedInRecipe").asBoolean()) {
                usedIngredient = node;
                break;
            }
        }
        assertThat(usedIngredient).isNotNull();

        long usedIngId = usedIngredient.path("id").asLong();
        String usedIngCode = usedIngredient.path("code").asText();
        String usedIngName = usedIngredient.path("name").asText();

        String changeUnitPayload = """
                {
                  "code": "%s",
                  "name": "%s",
                  "unit": "g",
                  "minStockThreshold": 5.0,
                  "active": true
                }
                """.formatted(usedIngCode, usedIngName);

        mockMvc.perform(put("/api/v1/admin/catalog/ingredients/{id}", usedIngId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(changeUnitPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    private String obtainAdminToken() throws Exception {
        String loginPayload = """
                {
                  "email": "admin@banquethub.vn",
                  "password": "Admin@123"
                }
                """;
        MvcResult res = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
        String token = json.path("data").path("accessToken").asText();
        assertThat(token).isNotBlank();
        return token;
    }
}
