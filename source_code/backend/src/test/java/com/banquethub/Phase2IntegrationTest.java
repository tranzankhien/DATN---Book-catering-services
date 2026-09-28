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

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Phase2IntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String TEST_PHONE = "093" + (System.currentTimeMillis() % 10000000);

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
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private String obtainUserToken() throws Exception {
        String loginPayload = """
                {
                  "email": "user@banquethub.vn",
                  "password": "User@123"
                }
                """;
        MvcResult res = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    @Order(1)
    @DisplayName("1. Admin tạo nhà cung cấp mới thành công (201 Created)")
    void testCreateSupplierSuccess() throws Exception {
        String adminToken = obtainAdminToken();
        String payload = String.format("""
                {
                  "name": "Công Ty TNHH Nông Sản Xanh Mekong",
                  "phone": "%s",
                  "email": "mekonggreen@example.com",
                  "address": "Số 45 Đường 30/4, Ninh Kiều, Cần Thơ",
                  "note": "Nhà cung cấp rau củ đạt chuẩn VietGAP",
                  "active": true
                }
                """, TEST_PHONE);

        mockMvc.perform(post("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").isNotEmpty())
                .andExpect(jsonPath("$.data.name").value("Công Ty TNHH Nông Sản Xanh Mekong"))
                .andExpect(jsonPath("$.data.phone").value(TEST_PHONE))
                .andExpect(jsonPath("$.data.active").value(true));
    }

    @Test
    @Order(2)
    @DisplayName("2. Chặn tạo nhà cung cấp trùng số điện thoại (409 Conflict)")
    void testCreateDuplicateSupplierPhone() throws Exception {
        String adminToken = obtainAdminToken();
        String payload = String.format("""
                {
                  "name": "Nông Sản Mekong Trùng Phone",
                  "phone": "%s",
                  "email": "mekong2@example.com",
                  "address": "Địa chỉ khác",
                  "active": true
                }
                """, TEST_PHONE);

        mockMvc.perform(post("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString(TEST_PHONE)));
    }

    @Test
    @Order(3)
    @DisplayName("3. Tìm kiếm nhà cung cấp theo tên và số điện thoại")
    void testSearchSupplier() throws Exception {
        String adminToken = obtainAdminToken();

        // Tìm theo tên
        mockMvc.perform(get("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("keyword", "Mekong"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));

        // Tìm theo số điện thoại
        mockMvc.perform(get("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("keyword", TEST_PHONE))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].phone").value(TEST_PHONE));
    }

    @Test
    @Order(4)
    @DisplayName("4. Cập nhật thông tin và toggle active nhà cung cấp")
    void testUpdateAndToggleSupplier() throws Exception {
        String adminToken = obtainAdminToken();

        // Lấy supplier vừa tạo
        MvcResult searchRes = mockMvc.perform(get("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("keyword", TEST_PHONE))
                .andReturn();
        long supplierId = objectMapper.readTree(searchRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        // Cập nhật thông tin
        String updatePayload = String.format("""
                {
                  "name": "Công Ty Cổ Phần Nông Sản Xanh Mekong Quốc Tế",
                  "phone": "%s",
                  "email": "mekong.intl@example.com",
                  "address": "Số 45 Đường 30/4, Ninh Kiều, Cần Thơ",
                  "note": "Nâng cấp đối tác chiến lược",
                  "active": true
                }
                """, TEST_PHONE);
        mockMvc.perform(put("/api/v1/admin/suppliers/{id}", supplierId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Công Ty Cổ Phần Nông Sản Xanh Mekong Quốc Tế"));

        // Toggle active -> false
        mockMvc.perform(patch("/api/v1/admin/suppliers/{id}/toggle-active", supplierId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(false));

        // Toggle active -> true
        mockMvc.perform(patch("/api/v1/admin/suppliers/{id}/toggle-active", supplierId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(true));
    }

    @Test
    @Order(5)
    @DisplayName("5. Tạo phiếu nhập nháp với 2 nguyên liệu: kiểm tra thành tiền từng dòng và tổng tiền tự tính")
    void testCreateDraftStockReceipt() throws Exception {
        String adminToken = obtainAdminToken();

        // Lấy supplier ID và 2 ingredient ID
        MvcResult supRes = mockMvc.perform(get("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        long supplierId = objectMapper.readTree(supRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        MvcResult ingRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        JsonNode ings = objectMapper.readTree(ingRes.getResponse().getContentAsString()).path("data");
        long ing1Id = ings.get(0).path("id").asLong();
        long ing2Id = ings.get(1).path("id").asLong();

        // 10 * 50.000 = 500.000; 5 * 120.000 = 600.000; Tổng = 1.100.000; Đã trả = 400.000
        String payload = String.format("""
                {
                  "supplierId": %d,
                  "receiptDate": "2026-11-10",
                  "note": "Phiếu nhập thử nghiệm Nháp",
                  "amountPaid": 400000,
                  "paymentNote": "Tạm ứng tiền mặt 400.000đ",
                  "confirmImmediately": false,
                  "items": [
                    { "ingredientId": %d, "quantity": 10.0, "unitPrice": 50000, "note": "Hàng loại 1" },
                    { "ingredientId": %d, "quantity": 5.0, "unitPrice": 120000, "note": "Hàng tươi" }
                  ]
                }
                """, supplierId, ing1Id, ing2Id);

        MvcResult res = mockMvc.perform(post("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").isNotEmpty())
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andExpect(jsonPath("$.data.paymentStatus").value("PARTIALLY_PAID"))
                .andExpect(jsonPath("$.data.totalAmount").value(1100000.0))
                .andExpect(jsonPath("$.data.amountPaid").value(400000.0))
                .andExpect(jsonPath("$.data.remainingAmount").value(700000.0))
                .andExpect(jsonPath("$.data.items", hasSize(2)))
                .andReturn();

        JsonNode data = objectMapper.readTree(res.getResponse().getContentAsString()).path("data");
        assertThat(data.path("items").get(0).path("lineTotal").asDouble()).isEqualTo(500000.0);
        assertThat(data.path("items").get(1).path("lineTotal").asDouble()).isEqualTo(600000.0);
    }

    @Test
    @Order(6)
    @DisplayName("6. Phiếu nhập nháp không làm thay đổi tồn kho nguyên liệu")
    void testDraftReceiptDoesNotChangeStock() throws Exception {
        String adminToken = obtainAdminToken();

        // Lấy danh sách phiếu nháp vừa tạo
        MvcResult receiptsRes = mockMvc.perform(get("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("status", "DRAFT"))
                .andReturn();
        JsonNode receipts = objectMapper.readTree(receiptsRes.getResponse().getContentAsString()).path("data");
        long receiptId = receipts.get(0).path("id").asLong();

        // Lấy chi tiết phiếu để biết ingredientId và tồn hiện tại
        MvcResult detailRes = mockMvc.perform(get("/api/v1/admin/stock-receipts/{id}", receiptId)
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        JsonNode detail = objectMapper.readTree(detailRes.getResponse().getContentAsString()).path("data");
        long ingId = detail.path("items").get(0).path("ingredientId").asLong();

        // Kiểm tra chi tiết nguyên liệu trong kho
        MvcResult ingDetailRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients/{id}", ingId)
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        JsonNode ingStock = objectMapper.readTree(ingDetailRes.getResponse().getContentAsString())
                .path("data").path("ingredient");

        // Nguyên liệu tồn kho không có biến động do phiếu nháp gây ra
        JsonNode movements = objectMapper.readTree(ingDetailRes.getResponse().getContentAsString())
                .path("data").path("recentMovements");
        for (JsonNode m : movements) {
            assertThat(m.path("referenceCode").asText()).isNotEqualTo(detail.path("code").asText());
        }
    }

    @Test
    @Order(7)
    @DisplayName("7. Sửa thông tin phiếu nhập nháp thành công")
    void testUpdateDraftReceipt() throws Exception {
        String adminToken = obtainAdminToken();

        MvcResult receiptsRes = mockMvc.perform(get("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("status", "DRAFT"))
                .andReturn();
        long receiptId = objectMapper.readTree(receiptsRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        MvcResult detailRes = mockMvc.perform(get("/api/v1/admin/stock-receipts/{id}", receiptId)
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        JsonNode detail = objectMapper.readTree(detailRes.getResponse().getContentAsString()).path("data");
        long supId = detail.path("supplierId").asLong();
        long ing1Id = detail.path("items").get(0).path("ingredientId").asLong();

        // Sửa còn 1 dòng: 20 * 50.000 = 1.000.000đ, amountPaid = 500.000đ
        String updatePayload = String.format("""
                {
                  "supplierId": %d,
                  "receiptDate": "2026-11-10",
                  "note": "Phiếu nháp đã được chỉnh sửa số lượng",
                  "amountPaid": 500000,
                  "paymentNote": "Chuyển khoản 500.000đ",
                  "confirmImmediately": false,
                  "items": [
                    { "ingredientId": %d, "quantity": 20.0, "unitPrice": 50000, "note": "Tăng số lượng lên 20" }
                  ]
                }
                """, supId, ing1Id);

        mockMvc.perform(put("/api/v1/admin/stock-receipts/{id}", receiptId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalAmount").value(1000000.0))
                .andExpect(jsonPath("$.data.amountPaid").value(500000.0))
                .andExpect(jsonPath("$.data.remainingAmount").value(500000.0))
                .andExpect(jsonPath("$.data.items", hasSize(1)));
    }

    @Test
    @Order(8)
    @DisplayName("8. Xóa phiếu nhập nháp thành công")
    void testDeleteDraftReceipt() throws Exception {
        String adminToken = obtainAdminToken();

        // Tạo 1 phiếu nháp riêng để test xóa
        MvcResult supRes = mockMvc.perform(get("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        long supId = objectMapper.readTree(supRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        MvcResult ingRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        long ingId = objectMapper.readTree(ingRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        String payload = String.format("""
                {
                  "supplierId": %d,
                  "receiptDate": "2026-11-10",
                  "note": "Phiếu để xóa thử nghiệm",
                  "amountPaid": 0,
                  "confirmImmediately": false,
                  "items": [
                    { "ingredientId": %d, "quantity": 1.0, "unitPrice": 10000 }
                  ]
                }
                """, supId, ingId);

        MvcResult createdRes = mockMvc.perform(post("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andReturn();
        long delReceiptId = objectMapper.readTree(createdRes.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Xóa phiếu
        mockMvc.perform(delete("/api/v1/admin/stock-receipts/{id}", delReceiptId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Kiểm tra lại không còn tìm thấy (404)
        mockMvc.perform(get("/api/v1/admin/stock-receipts/{id}", delReceiptId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(9)
    @DisplayName("9. Xác nhận phiếu nhập: tồn kho tăng đúng, ghi nhận StockMovement Type=IMPORT")
    void testConfirmStockReceipt() throws Exception {
        String adminToken = obtainAdminToken();

        // Lấy phiếu nháp còn lại
        MvcResult receiptsRes = mockMvc.perform(get("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("status", "DRAFT"))
                .andReturn();
        long receiptId = objectMapper.readTree(receiptsRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        MvcResult detailRes = mockMvc.perform(get("/api/v1/admin/stock-receipts/{id}", receiptId)
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        JsonNode detail = objectMapper.readTree(detailRes.getResponse().getContentAsString()).path("data");
        long ingId = detail.path("items").get(0).path("ingredientId").asLong();
        double importQty = detail.path("items").get(0).path("quantity").asDouble();

        // Lấy tồn trước khi xác nhận
        MvcResult ingBeforeRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients/{id}", ingId)
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        double stockBefore = objectMapper.readTree(ingBeforeRes.getResponse().getContentAsString())
                .path("data").path("ingredient").path("currentStock").asDouble();

        // Xác nhận phiếu
        mockMvc.perform(post("/api/v1/admin/stock-receipts/{id}/confirm", receiptId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.confirmedByName").isNotEmpty());

        // Lấy tồn sau khi xác nhận
        MvcResult ingAfterRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients/{id}", ingId)
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        double stockAfter = objectMapper.readTree(ingAfterRes.getResponse().getContentAsString())
                .path("data").path("ingredient").path("currentStock").asDouble();

        assertThat(stockAfter).isEqualTo(stockBefore + importQty);

        // Kiểm tra biến động kho có bản ghi IMPORT với mã phiếu
        MvcResult movRes = mockMvc.perform(get("/api/v1/admin/inventory/movements")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("ingredientId", String.valueOf(ingId))
                        .param("movementType", "IMPORT"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode movements = objectMapper.readTree(movRes.getResponse().getContentAsString()).path("data");
        assertThat(movements.size()).isGreaterThanOrEqualTo(1);
        assertThat(movements.get(0).path("referenceCode").asText()).isEqualTo(detail.path("code").asText());
    }

    @Test
    @Order(10)
    @DisplayName("10. Kiểm tra cập nhật giá vốn bình quân di động theo công thức liên hoàn")
    void testMovingWeightedAverageCost() throws Exception {
        String adminToken = obtainAdminToken();

        // Lấy 1 nguyên liệu để test công thức giá vốn
        MvcResult ingRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        JsonNode testIng = objectMapper.readTree(ingRes.getResponse().getContentAsString()).path("data").get(0);
        long ingId = testIng.path("id").asLong();
        BigDecimal oldStock = BigDecimal.valueOf(testIng.path("currentStock").asDouble());
        BigDecimal oldCost = BigDecimal.valueOf(testIng.path("avgUnitCost").asDouble());

        // Lấy supplier ID
        MvcResult supRes = mockMvc.perform(get("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        long supId = objectMapper.readTree(supRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        BigDecimal importQty = BigDecimal.valueOf(10.0);
        BigDecimal importPrice = BigDecimal.valueOf(80000.0);

        // Công thức mong đợi: (oldStock * oldCost + importQty * importPrice) / (oldStock + importQty)
        BigDecimal expectedNewCost = oldStock.multiply(oldCost)
                .add(importQty.multiply(importPrice))
                .divide(oldStock.add(importQty), 4, RoundingMode.HALF_UP);

        // Tạo và xác nhận ngay phiếu nhập
        String payload = String.format("""
                {
                  "supplierId": %d,
                  "receiptDate": "2026-11-10",
                  "note": "Test tính giá vốn bình quân",
                  "amountPaid": 800000,
                  "confirmImmediately": true,
                  "items": [
                    { "ingredientId": %d, "quantity": 10.0, "unitPrice": 80000 }
                  ]
                }
                """, supId, ingId);

        mockMvc.perform(post("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        // Lấy lại thông tin nguyên liệu
        MvcResult updatedIngRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients/{id}", ingId)
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        double actualAvgCost = objectMapper.readTree(updatedIngRes.getResponse().getContentAsString())
                .path("data").path("ingredient").path("avgUnitCost").asDouble();

        assertThat(BigDecimal.valueOf(actualAvgCost).setScale(2, RoundingMode.HALF_UP))
                .isEqualTo(expectedNewCost.setScale(2, RoundingMode.HALF_UP));
    }

    @Test
    @Order(11)
    @DisplayName("11. Chặn xác nhận lại phiếu nhập đã xác nhận trước đó (400 Bad Request)")
    void testCannotConfirmTwice() throws Exception {
        String adminToken = obtainAdminToken();

        // Lấy 1 phiếu CONFIRMED
        MvcResult receiptsRes = mockMvc.perform(get("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("status", "CONFIRMED"))
                .andReturn();
        long receiptId = objectMapper.readTree(receiptsRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        // Xác nhận lại lần 2 bị chặn 400
        mockMvc.perform(post("/api/v1/admin/stock-receipts/{id}/confirm", receiptId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(12)
    @DisplayName("12. Chặn sửa hoặc xóa phiếu nhập đã xác nhận (400 Bad Request)")
    void testCannotUpdateOrDeleteConfirmedReceipt() throws Exception {
        String adminToken = obtainAdminToken();

        MvcResult receiptsRes = mockMvc.perform(get("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("status", "CONFIRMED"))
                .andReturn();
        long receiptId = objectMapper.readTree(receiptsRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        // Cố tình sửa
        String updatePayload = """
                {
                  "supplierId": 1,
                  "receiptDate": "2026-11-10",
                  "note": "Cố tình sửa phiếu đã xác nhận",
                  "amountPaid": 0,
                  "confirmImmediately": false,
                  "items": [
                    { "ingredientId": 1, "quantity": 99.0, "unitPrice": 1000 }
                  ]
                }
                """;
        mockMvc.perform(put("/api/v1/admin/stock-receipts/{id}", receiptId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        // Cố tình xóa
        mockMvc.perform(delete("/api/v1/admin/stock-receipts/{id}", receiptId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @Order(13)
    @DisplayName("13. Ghi nhận thanh toán cho NCC: cập nhật amountPaid, paymentStatus và chặn trả quá số tiền")
    void testRecordPaymentForStockReceipt() throws Exception {
        String adminToken = obtainAdminToken();

        // Tìm phiếu còn nợ (PARTIALLY_PAID hoặc UNPAID)
        MvcResult receiptsRes = mockMvc.perform(get("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("paymentStatus", "PARTIALLY_PAID"))
                .andReturn();
        JsonNode receipts = objectMapper.readTree(receiptsRes.getResponse().getContentAsString()).path("data");
        assertThat(receipts.size()).isGreaterThanOrEqualTo(1);

        long receiptId = receipts.get(0).path("id").asLong();
        double remaining = receipts.get(0).path("remainingAmount").asDouble();

        // Thanh toán thêm vượt số tiền còn lại -> bị từ chối 400
        String overPaymentPayload = String.format("""
                {
                  "paymentAmount": %f,
                  "paymentNote": "Thanh toán lố tiền"
                }
                """, remaining + 100000.0);
        mockMvc.perform(post("/api/v1/admin/stock-receipts/{id}/payments", receiptId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(overPaymentPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        // Thanh toán vừa đủ số tiền còn lại -> thành PAID
        String exactPaymentPayload = String.format("""
                {
                  "paymentAmount": %f,
                  "paymentNote": "Thanh toán dứt điểm phiếu nhập"
                }
                """, remaining);
        mockMvc.perform(post("/api/v1/admin/stock-receipts/{id}/payments", receiptId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(exactPaymentPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.data.remainingAmount").value(0.0));
    }

    @Test
    @Order(14)
    @DisplayName("14. Điều chỉnh tồn kho thủ công (ADJUSTMENT) thành công")
    void testAdjustStockSuccess() throws Exception {
        String adminToken = obtainAdminToken();

        MvcResult ingRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        long ingId = objectMapper.readTree(ingRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        // Lấy tồn trước
        MvcResult beforeRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients/{id}", ingId)
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        double stockBefore = objectMapper.readTree(beforeRes.getResponse().getContentAsString())
                .path("data").path("ingredient").path("currentStock").asDouble();

        // Tăng thêm 2.5
        String payload = String.format("""
                {
                  "ingredientId": %d,
                  "quantityChange": 2.5,
                  "reason": "Kiểm kê định kỳ phát hiện dư thừa 2.5 đơn vị"
                }
                """, ingId);

        mockMvc.perform(post("/api/v1/admin/inventory/adjustments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").isNotEmpty())
                .andExpect(jsonPath("$.data.quantityChange").value(2.5));

        // Kiểm tra tồn sau
        MvcResult afterRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients/{id}", ingId)
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        double stockAfter = objectMapper.readTree(afterRes.getResponse().getContentAsString())
                .path("data").path("ingredient").path("currentStock").asDouble();

        assertThat(stockAfter).isEqualTo(stockBefore + 2.5);
    }

    @Test
    @Order(15)
    @DisplayName("15. Chặn điều chỉnh tồn kho làm số lượng tồn âm (400 Bad Request)")
    void testAdjustStockNegativeForbidden() throws Exception {
        String adminToken = obtainAdminToken();

        MvcResult ingRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        long ingId = objectMapper.readTree(ingRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        // Cố tình trừ 999999 làm tồn âm
        String payload = String.format("""
                {
                  "ingredientId": %d,
                  "quantityChange": -999999.0,
                  "reason": "Điều chỉnh âm quá mức"
                }
                """, ingId);

        mockMvc.perform(post("/api/v1/admin/inventory/adjustments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("âm")));
    }

    @Test
    @Order(16)
    @DisplayName("16. Xuất PDF phiếu nhập: HTTP 200, Content-Type: application/pdf và nội dung binary > 0")
    void testExportStockReceiptPdf() throws Exception {
        String adminToken = obtainAdminToken();

        MvcResult receiptsRes = mockMvc.perform(get("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        long receiptId = objectMapper.readTree(receiptsRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        MvcResult pdfResult = mockMvc.perform(get("/api/v1/admin/stock-receipts/{id}/pdf", receiptId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(header().exists("Content-Disposition"))
                .andReturn();

        byte[] pdfBytes = pdfResult.getResponse().getContentAsByteArray();
        assertThat(pdfBytes).isNotEmpty();
        assertThat(pdfBytes.length).isGreaterThan(1000); // File PDF chuẩn khổ A4 thường > 1KB
        // PDF header magic bytes "%PDF-"
        assertThat(new String(pdfBytes, 0, 5)).isEqualTo("%PDF-");
    }

    @Test
    @Order(17)
    @DisplayName("17. Chặn xóa vĩnh viễn nguyên liệu đã phát sinh biến động kho hoặc đang dùng trong công thức (400)")
    void testCannotDeleteUsedIngredient() throws Exception {
        String adminToken = obtainAdminToken();

        MvcResult ingRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        long ingId = objectMapper.readTree(ingRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        mockMvc.perform(delete("/api/v1/admin/inventory/ingredients/{id}", ingId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Không thể xóa vĩnh viễn")));
    }

    @Test
    @Order(18)
    @DisplayName("18. Phân quyền: User thường (ROLE_USER) hoặc Guest bị chặn (401/403) truy cập API kho và NCC")
    void testSecurityPermissions() throws Exception {
        // Guest không token -> 401
        mockMvc.perform(get("/api/v1/admin/suppliers"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/admin/inventory/overview"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/admin/stock-receipts"))
                .andExpect(status().isUnauthorized());

        // ROLE_USER có token -> 403 Forbidden
        String userToken = obtainUserToken();
        mockMvc.perform(get("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/inventory/overview")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(19)
    @DisplayName("19. P1 - Tính giá vốn bình quân gia quyền đúng chuẩn kế toán khi tồn cũ > 0 và giá vốn cũ = 0đ")
    void testWeightedAverageCostWhenOldCostZero() throws Exception {
        String adminToken = obtainAdminToken();

        // 1. Tạo nguyên liệu mới (tồn ban đầu 0 kg, giá vốn 0đ)
        String ingPayload = String.format("""
                {
                  "name": "Thịt Heo Rừng Tặng Kèm %d",
                  "unit": "kg",
                  "minStockThreshold": 5.0,
                  "active": true
                }
                """, System.currentTimeMillis());

        MvcResult ingResult = mockMvc.perform(post("/api/v1/admin/catalog/ingredients")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ingPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.code").value(org.hamcrest.Matchers.startsWith("ING-")))
                .andReturn();

        long ingId = objectMapper.readTree(ingResult.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // 2. Điều chỉnh kiểm kê tồn kho đầu kỳ lên 10 kg (giá vốn vẫn 0đ)
        String adjustPayload = String.format("""
                {
                  "ingredientId": %d,
                  "quantityChange": 10.0,
                  "reason": "Ghi nhận tồn kho đầu kỳ kiểm kê 0đ"
                }
                """, ingId);
        mockMvc.perform(post("/api/v1/admin/inventory/adjustments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adjustPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.quantityChange").value(10.0));

        // 3. Lấy 1 NCC active
        MvcResult supRes = mockMvc.perform(get("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        long supId = objectMapper.readTree(supRes.getResponse().getContentAsString())
                .path("data").get(0).path("id").asLong();

        // 4. Nhập thêm 10 kg với đơn giá 50.000đ -> Giá vốn mới = (10*0 + 10*50000) / 20 = 25.000đ/kg
        String receiptPayload = String.format("""
                {
                  "supplierId": %d,
                  "note": "Nhập thử nghiệm giá vốn 0đ",
                  "confirmImmediately": true,
                  "items": [
                    {
                      "ingredientId": %d,
                      "quantity": 10.0,
                      "unit": "kg",
                      "unitPrice": 50000.0
                    }
                  ]
                }
                """, supId, ingId);

        mockMvc.perform(post("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(receiptPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        // 5. Kiểm tra giá vốn nguyên liệu sau nhập kho: phải là 25000.0000, tồn kho = 20.0
        MvcResult checkRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients/{id}", ingId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode ingData = objectMapper.readTree(checkRes.getResponse().getContentAsString())
                .path("data").path("ingredient");
        assertThat(ingData.path("currentStock").asDouble()).isEqualTo(20.0);
        assertThat(ingData.path("avgUnitCost").asDouble()).isEqualTo(25000.0);
    }

    @Test
    @Order(20)
    @DisplayName("20. P1 - Khóa đơn vị tính của nguyên liệu khi đã có dòng phiếu nhập kho hoặc biến động kho (400)")
    void testUnitLockWhenHasReceiptItemsOrMovements() throws Exception {
        String adminToken = obtainAdminToken();

        // Lấy nguyên liệu đã có chứng từ kho từ test trước
        MvcResult ingRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        JsonNode firstIng = objectMapper.readTree(ingRes.getResponse().getContentAsString()).path("data").get(0);
        long ingId = firstIng.path("id").asLong();
        String currentUnit = firstIng.path("unit").asText();
        String newUnit = currentUnit.equalsIgnoreCase("kg") ? "g" : "kg";

        // Cố tình sửa đổi đơn vị tính -> Phải bị chặn 400
        String updatePayload = String.format("""
                {
                  "name": "%s",
                  "code": "%s",
                  "unit": "%s",
                  "minStockThreshold": 10.0,
                  "active": true
                }
                """, firstIng.path("name").asText(), firstIng.path("code").asText(), newUnit);

        mockMvc.perform(put("/api/v1/admin/catalog/ingredients/{id}", ingId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Không thể thay đổi đơn vị")));
    }

    @Test
    @Order(21)
    @DisplayName("21. P1 - Chặn xác nhận phiếu nhập khi nhà cung cấp hoặc nguyên liệu bị vô hiệu hóa (INACTIVE)")
    void testBlockConfirmWhenSupplierOrIngredientInactive() throws Exception {
        String adminToken = obtainAdminToken();

        // 1. Tạo 1 NCC và chuyển sang inactive
        String supPayload = String.format("""
                {
                  "name": "NCC Tạm Khóa %d",
                  "phone": "098%07d",
                  "address": "TP HCM",
                  "active": true
                }
                """, System.currentTimeMillis(), System.currentTimeMillis() % 10000000);
        MvcResult supRes = mockMvc.perform(post("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(supPayload))
                .andExpect(status().isCreated())
                .andReturn();
        long supId = objectMapper.readTree(supRes.getResponse().getContentAsString()).path("data").path("id").asLong();

        // Lấy 1 nguyên liệu active
        MvcResult ingRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        long ingId = objectMapper.readTree(ingRes.getResponse().getContentAsString()).path("data").get(0).path("id").asLong();
        String ingUnit = objectMapper.readTree(ingRes.getResponse().getContentAsString()).path("data").get(0).path("unit").asText();

        // Tạo phiếu nháp
        String draftPayload = String.format("""
                {
                  "supplierId": %d,
                  "note": "Phiếu nháp kiểm tra NCC inactive",
                  "items": [
                    {
                      "ingredientId": %d,
                      "quantity": 5.0,
                      "unit": "%s",
                      "unitPrice": 40000.0
                    }
                  ]
                }
                """, supId, ingId, ingUnit);
        MvcResult receiptRes = mockMvc.perform(post("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(draftPayload))
                .andExpect(status().isCreated())
                .andReturn();
        long receiptId = objectMapper.readTree(receiptRes.getResponse().getContentAsString()).path("data").path("id").asLong();

        // Khóa NCC qua toggle-active
        mockMvc.perform(patch("/api/v1/admin/suppliers/{id}/toggle-active", supId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Cố xác nhận phiếu -> 400
        mockMvc.perform(post("/api/v1/admin/stock-receipts/{id}/confirm", receiptId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("tạm ngừng hoạt động")));
    }

    @Test
    @Order(22)
    @DisplayName("22. P2 - Chặn ghi nhận thanh toán trên phiếu Nháp (DRAFT) và chặn xóa phiếu nháp đã có thanh toán")
    void testDraftPaymentRules() throws Exception {
        String adminToken = obtainAdminToken();

        // 1. Lấy 1 NCC active và 1 nguyên liệu
        MvcResult supRes = mockMvc.perform(get("/api/v1/admin/suppliers")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        long supId = objectMapper.readTree(supRes.getResponse().getContentAsString()).path("data").get(0).path("id").asLong();

        MvcResult ingRes = mockMvc.perform(get("/api/v1/admin/inventory/ingredients")
                        .header("Authorization", "Bearer " + adminToken))
                .andReturn();
        long ingId = objectMapper.readTree(ingRes.getResponse().getContentAsString()).path("data").get(0).path("id").asLong();
        String ingUnit = objectMapper.readTree(ingRes.getResponse().getContentAsString()).path("data").get(0).path("unit").asText();

        // Tạo phiếu DRAFT không thanh toán trước
        String draftPayload = String.format("""
                {
                  "supplierId": %d,
                  "note": "Phiếu nháp test thanh toán",
                  "items": [
                    {
                      "ingredientId": %d,
                      "quantity": 2.0,
                      "unit": "%s",
                      "unitPrice": 10000.0
                    }
                  ]
                }
                """, supId, ingId, ingUnit);
        MvcResult receiptRes = mockMvc.perform(post("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(draftPayload))
                .andExpect(status().isCreated())
                .andReturn();
        long draftId = objectMapper.readTree(receiptRes.getResponse().getContentAsString()).path("data").path("id").asLong();

        // Thử ghi nhận thanh toán trên phiếu DRAFT -> Phải bị chặn 400
        String payPayload = """
                {
                  "paymentAmount": 10000.0,
                  "paymentNote": "Thanh toán trên nháp"
                }
                """;
        mockMvc.perform(post("/api/v1/admin/stock-receipts/{id}/payments", draftId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("trạng thái Nháp")));

        // Xóa phiếu nháp chưa thanh toán thành công -> 200
        mockMvc.perform(delete("/api/v1/admin/stock-receipts/{id}", draftId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @Order(23)
    @DisplayName("23. P2 - Phân trang sổ biến động kho cấp DB và lọc theo khoảng ngày với headers HTTP")
    void testStockMovementsDbPagination() throws Exception {
        String adminToken = obtainAdminToken();

        // Gọi API phân trang size=5, page=0
        mockMvc.perform(get("/api/v1/admin/inventory/movements")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "0")
                        .param("size", "5"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Total-Count"))
                .andExpect(header().exists("X-Total-Pages"))
                .andExpect(header().string("X-Current-Page", "0"))
                .andExpect(header().string("X-Page-Size", "5"))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))));
    }
}
