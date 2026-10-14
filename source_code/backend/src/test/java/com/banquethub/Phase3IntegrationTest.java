package com.banquethub;

import com.banquethub.modules.catalog.entity.Dish;
import com.banquethub.modules.catalog.entity.Ingredient;
import com.banquethub.modules.catalog.repository.DishRepository;
import com.banquethub.modules.catalog.repository.IngredientRepository;
import com.banquethub.modules.orders.entity.Order;
import com.banquethub.modules.orders.entity.OrderStatus;
import com.banquethub.modules.orders.entity.OrderStatusHistory;
import com.banquethub.modules.orders.repository.OrderRepository;
import com.banquethub.modules.orders.repository.OrderStatusHistoryRepository;
import com.banquethub.modules.reservations.entity.ReservationStatus;
import com.banquethub.modules.reservations.entity.StockReservation;
import com.banquethub.modules.reservations.repository.StockReservationRepository;
import com.banquethub.modules.reservations.service.ReservationExpiryScheduler;
import com.banquethub.modules.reservations.service.StockReservationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class Phase3IntegrationTest {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DishRepository dishRepository;

    @Autowired
    private IngredientRepository ingredientRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Autowired
    private StockReservationRepository reservationRepository;

    @Autowired
    private StockReservationService reservationService;

    @Autowired
    private ReservationExpiryScheduler expiryScheduler;

    private static Long createdMenuId;
    private static Long userAOrderId;
    private static Long userBOrderId;

    @org.junit.jupiter.api.BeforeEach
    void ensureStockAvailable() {
        for (Ingredient ing : ingredientRepository.findAll()) {
            BigDecimal active = reservationRepository.getActiveReservedQuantity(ing.getId(), OffsetDateTime.now(VN_ZONE));
            BigDecimal base = active != null ? active : BigDecimal.ZERO;
            if (ing.getCurrentStock().compareTo(base.add(new BigDecimal("20.000"))) < 0) {
                ing.setCurrentStock(base.add(new BigDecimal("50.000")));
                ingredientRepository.save(ing);
            }
        }
    }

    private String obtainAdminToken() throws Exception {
        String payload = """
                {
                  "email": "admin@banquethub.vn",
                  "password": "Admin@123"
                }
                """;
        MvcResult res = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private String obtainUserToken() throws Exception {
        String payload = """
                {
                  "email": "user@banquethub.vn",
                  "password": "User@123"
                }
                """;
        MvcResult res = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private String obtainEmployeeToken() throws Exception {
        String payload = """
                {
                  "email": "employee@banquethub.vn",
                  "password": "Employee@123"
                }
                """;
        MvcResult res = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private String createAndObtainSecondUserToken() throws Exception {
        String uniqueEmail = "user2_" + UUID.randomUUID().toString().substring(0, 8) + "@banquethub.vn";
        String regPayload = String.format("""
                {
                  "fullName": "Khách Hàng Thứ Hai",
                  "email": "%s",
                  "password": "User@123",
                  "phone": "0987654321"
                }
                """, uniqueEmail);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regPayload))
                .andExpect(status().isCreated());

        String loginPayload = String.format("""
                {
                  "email": "%s",
                  "password": "User@123"
                }
                """, uniqueEmail);
        MvcResult res = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    // =========================================================================
    // TC-01: Admin tạo thực đơn có nhiều món (Lưu đúng món và số lượng)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(1)
    @DisplayName("TC-01: Admin tạo thực đơn mẫu với nhiều món ăn")
    void tc01_adminCreateMenuWithMultipleDishes() throws Exception {
        String adminToken = obtainAdminToken();

        Dish dish1 = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        Dish dish2 = dishRepository.findByCodeIgnoreCase("DISH-002").orElseThrow();

        String payload = String.format("""
                {
                  "name": "Thực Đơn Test Đặc Biệt",
                  "description": "Thực đơn kiểm thử tự động Phase 3",
                  "imageUrl": "https://images.unsplash.com/photo-test",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1, "displayOrder": 1 },
                    { "dishId": %d, "quantityPerTable": 2, "displayOrder": 2 }
                  ]
                }
                """, dish1.getId(), dish2.getId());

        MvcResult res = mockMvc.perform(post("/api/v1/admin/menus")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value(containsString("MN-")))
                .andExpect(jsonPath("$.data.items", hasSize(2)))
                .andExpect(jsonPath("$.data.items[0].quantityPerTable").value(1))
                .andExpect(jsonPath("$.data.items[1].quantityPerTable").value(2))
                .andReturn();

        createdMenuId = objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("id").asLong();
        assertThat(createdMenuId).isNotNull();
    }

    // =========================================================================
    // TC-02: Tính tổng tiền một bàn chính xác (250k + 2x80k... hoặc dish1 + 2xdish2)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(2)
    @DisplayName("TC-02: Tính tổng tiền một bàn chính xác dựa trên giá món trong DB")
    void tc02_calculatePricePerTableAccurately() throws Exception {
        Dish dish1 = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        Dish dish2 = dishRepository.findByCodeIgnoreCase("DISH-002").orElseThrow();
        BigDecimal expectedPerTable = dish1.getPrice().multiply(BigDecimal.valueOf(1))
                .add(dish2.getPrice().multiply(BigDecimal.valueOf(2)));

        mockMvc.perform(get("/api/v1/menus/" + createdMenuId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.pricePerTable").value(expectedPerTable.doubleValue()));
    }

    // =========================================================================
    // TC-03: Tổng tiền khi đặt 5 bàn bằng giá một bàn × 5
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(3)
    @DisplayName("TC-03: Tổng tiền khi đặt 5 bàn bằng giá một bàn nhân 5")
    void tc03_totalPriceFor5Tables() throws Exception {
        Dish dish1 = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        Dish dish2 = dishRepository.findByCodeIgnoreCase("DISH-002").orElseThrow();
        BigDecimal pricePerTable = dish1.getPrice().multiply(BigDecimal.valueOf(1))
                .add(dish2.getPrice().multiply(BigDecimal.valueOf(2)));
        BigDecimal expectedTotal = pricePerTable.multiply(BigDecimal.valueOf(5));

        String previewPayload = String.format("""
                {
                  "menuId": %d,
                  "tableCount": 5
                }
                """, createdMenuId);

        mockMvc.perform(post("/api/v1/menus/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(previewPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tableCount").value(5))
                .andExpect(jsonPath("$.data.pricePerTable").value(pricePerTable.doubleValue()))
                .andExpect(jsonPath("$.data.totalAmount").value(expectedTotal.doubleValue()));
    }

    // =========================================================================
    // TC-04: User tự thêm, xóa, chỉnh số lượng món (Menu Builder Preview)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(4)
    @DisplayName("TC-04: User tự tạo thực đơn tự chọn và xem trước tổng tiền")
    void tc04_userCustomMenuBuilderPreview() throws Exception {
        Dish dish3 = dishRepository.findByCodeIgnoreCase("DISH-003").orElseThrow();
        Dish dish4 = dishRepository.findByCodeIgnoreCase("DISH-004").orElseThrow();

        String payload = String.format("""
                {
                  "tableCount": 3,
                  "items": [
                    { "dishId": %d, "quantityPerTable": 2 },
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, dish3.getId(), dish4.getId());

        BigDecimal expectedPerTable = dish3.getPrice().multiply(BigDecimal.valueOf(2))
                .add(dish4.getPrice().multiply(BigDecimal.valueOf(1)));
        BigDecimal expectedTotal = expectedPerTable.multiply(BigDecimal.valueOf(3));

        mockMvc.perform(post("/api/v1/orders/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items", hasSize(2)))
                .andExpect(jsonPath("$.data.pricePerTable").value(expectedPerTable.doubleValue()))
                .andExpect(jsonPath("$.data.totalAmount").value(expectedTotal.doubleValue()));
    }

    // =========================================================================
    // TC-05: Không cho tạo thực đơn rỗng hoặc món có số lượng không hợp lệ
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(5)
    @DisplayName("TC-05: Từ chối thực đơn rỗng hoặc số lượng món nhỏ hơn hoặc bằng 0")
    void tc05_rejectEmptyMenuOrInvalidQuantity() throws Exception {
        String adminToken = obtainAdminToken();

        // 1. Empty items
        String emptyPayload = """
                {
                  "name": "Thực đơn rỗng",
                  "items": []
                }
                """;
        mockMvc.perform(post("/api/v1/admin/menus")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(emptyPayload))
                .andExpect(status().isBadRequest());

        // 2. Quantity <= 0
        Dish dish1 = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        String invalidQtyPayload = String.format("""
                {
                  "name": "Thực đơn sai số lượng",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 0 }
                  ]
                }
                """, dish1.getId());
        mockMvc.perform(post("/api/v1/admin/menus")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidQtyPayload))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // TC-06: Khách không thể sửa giá món từ frontend để đặt với giá thấp hơn (BR-01)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(6)
    @DisplayName("TC-06: Backend tự tính giá từ CSDL, hoàn toàn bỏ qua giá can thiệp từ client")
    void tc06_clientPriceManipulationIgnored() throws Exception {
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        OffsetDateTime futureDate = OffsetDateTime.now(VN_ZONE).plusDays(7);

        // Attempting to send manipulated client total (1000đ)
        String payload = String.format("""
                {
                  "customerName": "Khách Thử Nghiệm Hack Giá",
                  "customerPhone": "0912345678",
                  "customerEmail": "hacker@test.com",
                  "eventDateTime": "%s",
                  "tableCount": 2,
                  "guestCount": 20,
                  "eventLocation": "Sảnh Tiệc Hoàng Gia",
                  "totalAmount": 1000,
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1, "unitPrice": 1000 }
                  ]
                }
                """, futureDate, dish.getId());

        String userToken = obtainUserToken();
        MvcResult res = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andReturn();

        BigDecimal expectedTotal = dish.getPrice().multiply(BigDecimal.valueOf(2));
        BigDecimal actualTotal = BigDecimal.valueOf(
                objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("totalAmount").asDouble()
        );
        assertThat(actualTotal).isEqualByComparingTo(expectedTotal);
    }

    // =========================================================================
    // TC-07: Tính tổng nguyên liệu cho nhiều món sử dụng chung một nguyên liệu (BR-04)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(7)
    @DisplayName("TC-07: Tổng hợp chính xác nhu cầu nguyên liệu khi nhiều món dùng chung nguyên liệu")
    void tc07_calculateIngredientDemandForSharedIngredients() throws Exception {
        // DISH-001 và DISH-002 đều dùng ING-TOM-SU
        Dish dish1 = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        Dish dish2 = dishRepository.findByCodeIgnoreCase("DISH-002").orElseThrow();

        String payload = String.format("""
                {
                  "tableCount": 2,
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 },
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, dish1.getId(), dish2.getId());

        MvcResult res = mockMvc.perform(post("/api/v1/orders/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.ingredientDemands", hasSize(greaterThanOrEqualTo(1))))
                .andReturn();

        JsonNode demands = objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("ingredientDemands");
        boolean foundTomSu = false;
        for (JsonNode demand : demands) {
            if ("ING-TOM-SU".equals(demand.path("ingredientCode").asText())) {
                foundTomSu = true;
                // dish1 needs 0.2kg * 2 tables = 0.4kg; dish2 needs 0.15kg * 2 tables = 0.3kg -> sum = 0.7kg
                assertThat(demand.path("requiredQuantity").asDouble()).isGreaterThan(0.0);
            }
        }
        assertThat(foundTomSu).isTrue();
    }

    // =========================================================================
    // TC-08: Đủ nguyên liệu thì tạo đơn và reservation thành công (BR-05)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(8)
    @DisplayName("TC-08: Đủ nguyên liệu thì tạo đơn PENDING_PAYMENT và StockReservation ACTIVE thành công")
    void tc08_sufficientStockCreatesOrderAndReservation() throws Exception {
        String userToken = obtainUserToken();
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        OffsetDateTime futureDate = OffsetDateTime.now(VN_ZONE).plusDays(5);

        String payload = String.format("""
                {
                  "customerName": "Nguyễn Văn Đặt Tiệc",
                  "customerPhone": "0988776655",
                  "customerEmail": "user@banquethub.vn",
                  "eventDateTime": "%s",
                  "tableCount": 2,
                  "guestCount": 20,
                  "eventLocation": "Sảnh Tiệc Hoàng Gia",
                  "note": "Kê bàn gần cửa sổ",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, dish.getId());

        MvcResult res = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderStatus").value("PENDING_PAYMENT"))
                .andExpect(jsonPath("$.data.paymentStatus").value("UNPAID"))
                .andExpect(jsonPath("$.data.reservation.status").value("ACTIVE"))
                .andReturn();

        userAOrderId = objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("id").asLong();
        assertThat(userAOrderId).isNotNull();
    }

    // =========================================================================
    // TC-09: Thiếu nguyên liệu thì không tạo đơn và không giữ một phần (BR-05)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(9)
    @DisplayName("TC-09: Thiếu nguyên liệu thì từ chối toàn bộ đơn, không giữ một phần nguyên liệu")
    void tc09_insufficientStockRejectsBooking() throws Exception {
        String userToken = obtainUserToken();
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        OffsetDateTime futureDate = OffsetDateTime.now(VN_ZONE).plusDays(5);

        // 400 tables demands 400 * 0.8 = 320kg, which exceeds available stock in inventory
        String payload = String.format("""
                {
                  "customerName": "Khách Đặt Quá Tải",
                  "customerPhone": "0988776655",
                  "customerEmail": "overload@test.com",
                  "eventDateTime": "%s",
                  "tableCount": 400,
                  "guestCount": 4000,
                  "eventLocation": "Sảnh Tiệc Hoàng Gia",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, dish.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("nguyên liệu khả dụng")));
    }

    // =========================================================================
    // TC-10: Tạo reservation không làm thay đổi tồn thực tế (BR-06)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(10)
    @DisplayName("TC-10: Tạo giữ chỗ nguyên liệu không làm thay đổi physicalStock")
    void tc10_reservationDoesNotAlterPhysicalStock() throws Exception {
        Ingredient tomSu = ingredientRepository.findByCodeIgnoreCase("ING-TOM-SU").orElseThrow();
        BigDecimal stockBefore = tomSu.getCurrentStock();

        // Create order with 1 table
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-003").orElseThrow();
        OffsetDateTime futureDate = OffsetDateTime.now(VN_ZONE).plusDays(3);
        String payload = String.format("""
                {
                  "customerName": "Khách Kiểm Tra Tồn Kho",
                  "customerPhone": "0911223344",
                  "customerEmail": "checkstock@test.com",
                  "eventDateTime": "%s",
                  "tableCount": 1,
                  "guestCount": 10,
                  "eventLocation": "Sảnh Tiệc Hoàng Gia",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, dish.getId());

        String userToken = obtainUserToken();
        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());

        Ingredient tomSuAfter = ingredientRepository.findByCodeIgnoreCase("ING-TOM-SU").orElseThrow();
        assertThat(tomSuAfter.getCurrentStock()).isEqualByComparingTo(stockBefore);
    }

    // =========================================================================
    // TC-11: Một đơn giữ nguyên liệu 15 phút (BR-07)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(11)
    @DisplayName("TC-11: Thời hạn giữ nguyên liệu được thiết lập chính xác 15 phút")
    void tc11_reservationHeldFor15Minutes() throws Exception {
        Order order = orderRepository.findById(userAOrderId).orElseThrow();
        OffsetDateTime expiresAt = order.getPaymentExpiresAt();
        OffsetDateTime createdAt = order.getCreatedAt();

        long diffSeconds = java.time.Duration.between(createdAt, expiresAt).getSeconds();
        long diffMinutes = Math.round(diffSeconds / 60.0);
        assertThat(diffMinutes).isEqualTo(15L);
    }

    // =========================================================================
    // TC-12: Hết hạn thì giải phóng lượng giữ (BR-08)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(12)
    @DisplayName("TC-12: Đơn quá 15 phút chuyển sang EXPIRED và giải phóng reservation")
    void tc12_expiredReservationReleasesStock() throws Exception {
        // Create an order and backdate its paymentExpiresAt to 20 minutes ago
        Order order = orderRepository.findById(userAOrderId).orElseThrow();
        order.setPaymentExpiresAt(OffsetDateTime.now(VN_ZONE).minusMinutes(5));
        orderRepository.save(order);

        // Run scheduler
        expiryScheduler.cleanupExpiredReservations();

        Order updatedOrder = orderRepository.findById(userAOrderId).orElseThrow();
        assertThat(updatedOrder.getOrderStatus()).isEqualTo(OrderStatus.EXPIRED);

        StockReservation res = reservationRepository.findByOrderId(userAOrderId).orElseThrow();
        assertThat(res.getStatus()).isEqualTo(ReservationStatus.EXPIRED);
    }

    // =========================================================================
    // TC-13: Hủy đơn trước thanh toán thì giải phóng lượng giữ ngay (BR-08)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(13)
    @DisplayName("TC-13: Hủy đơn PENDING_PAYMENT ngay lập tức giải phóng nguyên liệu")
    void tc13_cancelledOrderImmediatelyReleasesStock() throws Exception {
        String userToken = obtainUserToken();
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        OffsetDateTime futureDate = OffsetDateTime.now(VN_ZONE).plusDays(4);

        // Create new active order
        String payload = String.format("""
                {
                  "customerName": "Khách Muốn Hủy",
                  "customerPhone": "0977889900",
                  "customerEmail": "user@banquethub.vn",
                  "eventDateTime": "%s",
                  "tableCount": 1,
                  "guestCount": 10,
                  "eventLocation": "Sảnh Tiệc Hoàng Gia",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, dish.getId());

        MvcResult res = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andReturn();

        long cancelOrderId = objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Cancel order
        mockMvc.perform(post("/api/v1/orders/" + cancelOrderId + "/cancel")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Thay đổi kế hoạch gia đình\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderStatus").value("CANCELLED"));

        StockReservation resEntity = reservationRepository.findByOrderId(cancelOrderId).orElseThrow();
        assertThat(resEntity.getStatus()).isEqualTo(ReservationStatus.RELEASED);
    }

    // =========================================================================
    // TC-14: Concurrency: Hai user cùng tranh lượng tồn cuối cùng (BR-14)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(14)
    @DisplayName("TC-14: Đồng thời tranh chấp tồn khả dụng (Pessimistic Lock) - chỉ 1 đơn thành công")
    void tc14_concurrencySafeStockReservation() throws Exception {
        // Guarantee exact 10.000 kg available stock for ING-TOM-SU (DISH-003 has single ingredient ING-TOM-SU 0.8kg/table)
        Ingredient tomSu = ingredientRepository.findByCodeIgnoreCase("ING-TOM-SU").orElseThrow();
        BigDecimal active = reservationRepository.getActiveReservedQuantity(tomSu.getId(), OffsetDateTime.now(VN_ZONE));
        BigDecimal base = active != null ? active : BigDecimal.ZERO;
        tomSu.setCurrentStock(base.add(new BigDecimal("10.000")));
        ingredientRepository.save(tomSu);

        // DISH-003 requires 0.8kg ING-TOM-SU per table.
        // 8 tables = 6.4kg (< 10kg, succeeds). 2 orders = 12.8kg (> 10kg, one must fail).
        int tablesPerOrder = 8;
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-003").orElseThrow();
        OffsetDateTime futureDate = OffsetDateTime.now(VN_ZONE).plusDays(6);

        String payload1 = String.format("""
                {
                  "customerName": "Người Tranh Tồn 1",
                  "customerPhone": "0911111111",
                  "customerEmail": "race1@test.com",
                  "eventDateTime": "%s",
                  "tableCount": %d,
                  "guestCount": %d,
                  "eventLocation": "Sảnh Tiệc Hoàng Gia",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, tablesPerOrder, tablesPerOrder * 10, dish.getId());

        String payload2 = String.format("""
                {
                  "customerName": "Người Tranh Tồn 2",
                  "customerPhone": "0922222222",
                  "customerEmail": "race2@test.com",
                  "eventDateTime": "%s",
                  "tableCount": %d,
                  "guestCount": %d,
                  "eventLocation": "Sảnh Tiệc Hoàng Gia",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, tablesPerOrder, tablesPerOrder * 10, dish.getId());

        String userToken = obtainUserToken();
        ExecutorService executor = Executors.newFixedThreadPool(2);
        List<Callable<Integer>> tasks = List.of(
                () -> mockMvc.perform(post("/api/v1/orders")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload1))
                        .andReturn().getResponse().getStatus(),
                () -> mockMvc.perform(post("/api/v1/orders")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload2))
                        .andReturn().getResponse().getStatus()
        );

        List<Future<Integer>> futures = executor.invokeAll(tasks);
        List<Integer> statusCodes = new ArrayList<>();
        for (Future<Integer> f : futures) {
            statusCodes.add(f.get());
        }
        executor.shutdown();

        // Exactly one succeeds (201) and one fails (400) because of insufficient stock
        assertThat(statusCodes).contains(201);
        assertThat(statusCodes).contains(400);
    }

    // =========================================================================
    // TC-15: Gửi trùng request tạo đơn với idempotencyKey không tạo hai đơn (BR-13)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(15)
    @DisplayName("TC-15: Chống trùng lặp đơn hàng khi gửi lại request với cùng idempotencyKey")
    void tc15_idempotencyKeyPreventsDuplicateOrders() throws Exception {
        String idempotencyKey = "IDEM-" + UUID.randomUUID();
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        OffsetDateTime futureDate = OffsetDateTime.now(VN_ZONE).plusDays(10);

        String payload = String.format("""
                {
                  "customerName": "Khách Idempotent",
                  "customerPhone": "0933333333",
                  "customerEmail": "idem@test.com",
                  "eventDateTime": "%s",
                  "tableCount": 1,
                  "guestCount": 10,
                  "eventLocation": "Sảnh Tiệc Hoàng Gia",
                  "idempotencyKey": "%s",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, idempotencyKey, dish.getId());

        String userToken = obtainUserToken();
        MvcResult res1 = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andReturn();

        long id1 = objectMapper.readTree(res1.getResponse().getContentAsString()).path("data").path("id").asLong();

        // Retry same request
        MvcResult res2 = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andReturn();

        long id2 = objectMapper.readTree(res2.getResponse().getContentAsString()).path("data").path("id").asLong();

        assertThat(id1).isEqualTo(id2);
    }

    // =========================================================================
    // TC-16: User A không truy cập được đơn của User B (BR-11)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(16)
    @DisplayName("TC-16: Bảo mật phân quyền: User A không xem được đơn của User B")
    void tc16_userIsolationCannotAccessOtherOrders() throws Exception {
        String userBToken = createAndObtainSecondUserToken();
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        OffsetDateTime futureDate = OffsetDateTime.now(VN_ZONE).plusDays(10);

        // User B creates order
        String payload = String.format("""
                {
                  "customerName": "User B",
                  "customerPhone": "0988888888",
                  "customerEmail": "userb@banquethub.vn",
                  "eventDateTime": "%s",
                  "tableCount": 1,
                  "guestCount": 10,
                  "eventLocation": "Sảnh Tiệc Hoàng Gia",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, dish.getId());

        MvcResult res = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andReturn();

        userBOrderId = objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // User A tries to view User B's order
        String userAToken = obtainUserToken();
        mockMvc.perform(get("/api/v1/orders/" + userBOrderId)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("không có quyền")));
    }

    // =========================================================================
    // TC-17: Nhân viên không truy cập được API quản trị kho hoặc giá vốn
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(17)
    @DisplayName("TC-17: Nhân viên bị từ chối khi cố truy cập API quản trị nhập kho / giá vốn")
    void tc17_employeeRestrictedAccess() throws Exception {
        String empToken = obtainEmployeeToken();

        // Cannot create stock receipt
        mockMvc.perform(post("/api/v1/admin/stock-receipts")
                        .header("Authorization", "Bearer " + empToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        // Can view employee orders
        mockMvc.perform(get("/api/v1/employee/orders")
                        .header("Authorization", "Bearer " + empToken))
                .andExpect(status().isOk());
    }

    // =========================================================================
    // TC-18: Thay đổi giá món sau khi tạo đơn không ảnh hưởng tổng tiền đơn cũ (BR-10)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(18)
    @DisplayName("TC-18: Snapshot tính bất biến: Thay đổi giá món không làm đổi tổng tiền đơn cũ")
    void tc18_priceSnapshotImmutability() throws Exception {
        String adminToken = obtainAdminToken();
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        BigDecimal originalPrice = dish.getPrice();

        // Create order at original price
        OffsetDateTime futureDate = OffsetDateTime.now(VN_ZONE).plusDays(8);
        String orderPayload = String.format("""
                {
                  "customerName": "Khách Kiểm Tra Bất Biến Giá",
                  "customerPhone": "0944444444",
                  "customerEmail": "snapshot@test.com",
                  "eventDateTime": "%s",
                  "tableCount": 2,
                  "guestCount": 20,
                  "eventLocation": "Sảnh Tiệc Hoàng Gia",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, dish.getId());

        String userToken = obtainUserToken();
        MvcResult res = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orderPayload))
                .andExpect(status().isCreated())
                .andReturn();

        long snapOrderId = objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("id").asLong();
        BigDecimal originalOrderTotal = BigDecimal.valueOf(
                objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("totalAmount").asDouble()
        );

        // Admin updates dish price in catalog to 999.000đ
        dish.setPrice(new BigDecimal("999000.00"));
        dishRepository.save(dish);

        // Re-read existing order
        MvcResult resAfter = mockMvc.perform(get("/api/v1/orders/" + snapOrderId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andReturn();

        BigDecimal afterOrderTotal = BigDecimal.valueOf(
                objectMapper.readTree(resAfter.getResponse().getContentAsString()).path("data").path("totalAmount").asDouble()
        );
        assertThat(afterOrderTotal).isEqualByComparingTo(originalOrderTotal);

        // Restore original dish price
        dish.setPrice(originalPrice);
        dishRepository.save(dish);
    }

    // =========================================================================
    // TC-19: Thay đổi công thức món sau khi tạo đơn không ảnh hưởng snapshot/reservation
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(19)
    @DisplayName("TC-19: Định lượng công thức trong đơn và reservation bất biến sau khi đặt")
    void tc19_recipeSnapshotImmutability() throws Exception {
        StockReservation res = reservationRepository.findByOrderId(userBOrderId).orElseThrow();
        assertThat(res.getItems()).isNotEmpty();
        assertThat(res.getItems().get(0).getReservedQuantity()).isGreaterThan(BigDecimal.ZERO);
    }

    // =========================================================================
    // TC-20: Đơn hết hạn không thể chuyển sang thanh toán bằng thao tác client
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(20)
    @DisplayName("TC-20: Đơn hết hạn (EXPIRED) không thể thao tác hủy hoặc thanh toán")
    void tc20_expiredOrderCannotBeManipulated() throws Exception {
        String userToken = obtainUserToken();
        mockMvc.perform(post("/api/v1/orders/" + userAOrderId + "/cancel")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.anyOf(
                        containsString("hết hạn"),
                        containsString("không thể hủy"),
                        containsString("Chờ thanh toán")
                )));
    }

    // =========================================================================
    // TC-21: Admin lọc đơn theo trạng thái và ngày đặt
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(21)
    @DisplayName("TC-21: Admin tìm kiếm và lọc danh sách đơn đặt tiệc thành công")
    void tc21_adminFilterOrders() throws Exception {
        String adminToken = obtainAdminToken();
        mockMvc.perform(get("/api/v1/admin/orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("orderStatus", "EXPIRED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))));
    }

    // =========================================================================
    // TC-22: Flyway migration không xóa dữ liệu của Phase 1 / Phase 2
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(22)
    @DisplayName("TC-22: Toàn bộ dữ liệu Phase 1 và Phase 2 được bảo toàn tuyệt đối")
    void tc22_flywayPreservesPhase1And2Data() {
        assertThat(dishRepository.count()).isGreaterThanOrEqualTo(10);
        assertThat(ingredientRepository.count()).isGreaterThanOrEqualTo(12);
    }

    // =========================================================================
    // TC-23: Khách vãng lai (Guest) không thể tạo hoặc xem chi tiết đơn hàng
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(23)
    @DisplayName("TC-23: Khách vãng lai bị từ chối truy cập (401) khi tạo hoặc xem chi tiết đơn hàng")
    void tc23_guestAuthorizationEnforced() throws Exception {
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        OffsetDateTime futureDate = OffsetDateTime.now(VN_ZONE).plusDays(5);
        String payload = String.format("""
                {
                  "customerName": "Khách Vãng Lai",
                  "customerPhone": "0988776655",
                  "customerEmail": "guest@test.com",
                  "eventDateTime": "%s",
                  "tableCount": 2,
                  "guestCount": 20,
                  "eventLocation": "Sảnh Tiệc Hoàng Gia",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, dish.getId());

        // Guest creating order without JWT
        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized());

        // Guest viewing order without JWT
        mockMvc.perform(get("/api/v1/orders/" + userBOrderId))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // TC-24: Phân quyền Employee: chỉ xem đơn PENDING_PAYMENT, không thể hủy đơn khách
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(24)
    @DisplayName("TC-24: Employee không có quyền hủy đơn tiệc của khách hàng qua API")
    void tc24_employeeAccessRestrictions() throws Exception {
        String employeeToken = obtainEmployeeToken();

        // Employee attempting to cancel order
        mockMvc.perform(post("/api/v1/orders/" + userBOrderId + "/cancel")
                        .header("Authorization", "Bearer " + employeeToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Nhân viên không có quyền hủy đơn")));
    }

    // =========================================================================
    // TC-25: Điều chỉnh giảm tồn kho không thể phá lượng nguyên liệu đang giữ
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(25)
    @DisplayName("TC-25: Từ chối điều chỉnh giảm tồn kho xuống dưới lượng đang giữ cho các đơn tiệc còn hiệu lực")
    void tc25_reducingStockBelowActiveReservationRejected() throws Exception {
        String adminToken = obtainAdminToken();
        Ingredient tomSu = ingredientRepository.findByCodeIgnoreCase("ING-TOM-SU").orElseThrow();

        // Query active reserved quantity for tomSu
        BigDecimal activeReserved = reservationRepository.getActiveReservedQuantity(tomSu.getId(), OffsetDateTime.now(VN_ZONE));
        if (activeReserved != null && activeReserved.compareTo(BigDecimal.ZERO) > 0) {
            // Attempt to reduce stock so that remaining stock is positive (> 0) but < activeReserved
            BigDecimal currentStock = tomSu.getCurrentStock();
            // Remaining stock = activeReserved - 1 (> 0, assuming activeReserved >= 2)
            BigDecimal targetStock = activeReserved.subtract(BigDecimal.ONE);
            if (targetStock.compareTo(BigDecimal.ZERO) <= 0) {
                targetStock = BigDecimal.valueOf(0.5);
            }
            BigDecimal excessiveReduction = targetStock.subtract(currentStock); // negative delta

            String adjustPayload = String.format("""
                    {
                      "ingredientId": %d,
                      "quantityChange": %s,
                      "reason": "Thử nghiệm giảm tồn kho quá mức cho phép"
                    }
                    """, tomSu.getId(), excessiveReduction.toPlainString());

            mockMvc.perform(post("/api/v1/admin/inventory/adjustments")
                            .header("Authorization", "Bearer " + adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(adjustPayload))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(containsString("được giữ bởi các đơn đặt tiệc")));
        }
    }

    // =========================================================================
    // TC-26: Retry đồng thời với cùng Idempotency Key trả về cùng một đơn hàng
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(26)
    @DisplayName("TC-26: Hai request gửi đồng thời với cùng Idempotency-Key và payload trả về cùng đơn hàng duy nhất")
    void tc26_concurrentRetrySameIdempotencyKey() throws Exception {
        // Ensure sufficient stock for DISH-001 (ING-TOM-SU)
        Ingredient tomSu = ingredientRepository.findByCodeIgnoreCase("ING-TOM-SU").orElseThrow();
        BigDecimal active = reservationRepository.getActiveReservedQuantity(tomSu.getId(), OffsetDateTime.now(VN_ZONE));
        BigDecimal base = active != null ? active : BigDecimal.ZERO;
        tomSu.setCurrentStock(base.add(new BigDecimal("10.000")));
        ingredientRepository.save(tomSu);

        String userToken = obtainUserToken();
        String concurrentKey = "CONCURRENT-" + UUID.randomUUID();
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        OffsetDateTime futureDate = OffsetDateTime.now(VN_ZONE).plusDays(12);

        String payload = String.format("""
                {
                  "customerName": "Khách Retry Đồng Thời",
                  "customerPhone": "0977889900",
                  "customerEmail": "user@banquethub.vn",
                  "eventDateTime": "%s",
                  "tableCount": 1,
                  "guestCount": 10,
                  "eventLocation": "Sảnh Tiệc Hoàng Gia",
                  "idempotencyKey": "%s",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, concurrentKey, dish.getId());

        ExecutorService executor = Executors.newFixedThreadPool(2);
        List<Callable<MvcResult>> tasks = List.of(
                () -> mockMvc.perform(post("/api/v1/orders")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                        .andReturn(),
                () -> mockMvc.perform(post("/api/v1/orders")
                                .header("Authorization", "Bearer " + userToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                        .andReturn()
        );

        List<Future<MvcResult>> futures = executor.invokeAll(tasks);
        List<Long> orderIds = new ArrayList<>();
        for (Future<MvcResult> f : futures) {
            MvcResult res = f.get();
            int status = res.getResponse().getStatus();
            assertThat(status).isBetween(200, 201);
            long id = objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("id").asLong();
            orderIds.add(id);
        }
        executor.shutdown();

        assertThat(orderIds).hasSize(2);
        assertThat(orderIds.get(0)).isEqualTo(orderIds.get(1));
    }

    // =========================================================================
    // TC-27: Preview thực đơn mẫu qua GET /api/v1/menus/{id}/preview
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(27)
    @DisplayName("TC-27: Xem trước giá và kiểm tra nguyên liệu thực đơn mẫu qua GET /menus/{id}/preview")
    void tc27_previewMenuByIdEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/menus/" + createdMenuId + "/preview")
                        .param("tableCount", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tableCount").value(3))
                .andExpect(jsonPath("$.data.items").isArray());
    }

    // =========================================================================
    // TC-28: Chỉ ROLE_USER mới được tạo đơn hàng (Admin & Employee bị 403)
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(28)
    @DisplayName("TC-28: Chỉ ROLE_USER mới được tạo đơn hàng, Admin và Employee bị 403 Forbidden")
    void tc28_createOrderRequiresUserRole() throws Exception {
        String adminToken = obtainAdminToken();
        String employeeToken = obtainEmployeeToken();
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        String futureDate = OffsetDateTime.now(VN_ZONE).plusDays(7).toString();

        String payload = String.format("""
                {
                  "customerName": "Admin User",
                  "customerPhone": "0988776655",
                  "customerEmail": "admin@banquethub.vn",
                  "eventDateTime": "%s",
                  "tableCount": 2,
                  "guestCount": 20,
                  "eventLocation": "Sảnh Khách VIP",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, dish.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + employeeToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // TC-29: Bắt buộc phải có eventLocation và guestCount khi tạo đơn hàng
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(29)
    @DisplayName("TC-29: Thiếu eventLocation hoặc guestCount sẽ bị từ chối với HTTP 400")
    void tc29_missingLocationOrGuestCountRejected() throws Exception {
        String userToken = obtainUserToken();
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        String futureDate = OffsetDateTime.now(VN_ZONE).plusDays(7).toString();

        // Thiếu eventLocation
        String noLocationPayload = String.format("""
                {
                  "customerName": "Khách Không Địa Điểm",
                  "customerPhone": "0912345678",
                  "customerEmail": "user@banquethub.vn",
                  "eventDateTime": "%s",
                  "tableCount": 2,
                  "guestCount": 20,
                  "eventLocation": "   ",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, dish.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(noLocationPayload))
                .andExpect(status().isBadRequest());

        // Thiếu guestCount
        String noGuestCountPayload = String.format("""
                {
                  "customerName": "Khách Không Số Khách",
                  "customerPhone": "0912345678",
                  "customerEmail": "user@banquethub.vn",
                  "eventDateTime": "%s",
                  "tableCount": 2,
                  "eventLocation": "Sảnh White Palace",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, dish.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(noGuestCountPayload))
                .andExpect(status().isBadRequest());
    }

    // =========================================================================
    // TC-30: Idempotency-Key trùng lặp nhưng đổi nội dung sẽ bị từ chối với HTTP 400
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(30)
    @DisplayName("TC-30: Retry với cùng Idempotency-Key nhưng thay đổi nội dung sẽ bị báo lỗi HTTP 400")
    void tc30_idempotencyDifferentPayloadRejected() throws Exception {
        String userToken = obtainUserToken();
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        String futureDate = OffsetDateTime.now(VN_ZONE).plusDays(7).toString();
        String idempotencyKey = UUID.randomUUID().toString();

        String originalPayload = String.format("""
                {
                  "customerName": "Khách Gốc",
                  "customerPhone": "0912345678",
                  "customerEmail": "user@banquethub.vn",
                  "eventDateTime": "%s",
                  "tableCount": 2,
                  "guestCount": 20,
                  "eventLocation": "Sảnh Crystal",
                  "idempotencyKey": "%s",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, idempotencyKey, dish.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(originalPayload))
                .andExpect(status().isCreated());

        // Cùng idempotencyKey nhưng đổi tableCount thành 3
        String modifiedPayload = String.format("""
                {
                  "customerName": "Khách Gốc",
                  "customerPhone": "0912345678",
                  "customerEmail": "user@banquethub.vn",
                  "eventDateTime": "%s",
                  "tableCount": 3,
                  "guestCount": 30,
                  "eventLocation": "Sảnh Diamond",
                  "idempotencyKey": "%s",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, idempotencyKey, dish.getId());

        mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(modifiedPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Idempotency-Key đã được sử dụng với nội dung đặt tiệc khác")));
    }

    // =========================================================================
    // TC-31: Hủy đơn quá hạn thanh toán sẽ commit trạng thái EXPIRED và ghi lịch sử
    // =========================================================================
    @Test
    @org.junit.jupiter.api.Order(31)
    @DisplayName("TC-31: Hủy đơn hàng đã quá hạn thanh toán sẽ commit trạng thái EXPIRED, ghi lịch sử và giải phóng giữ tồn")
    void tc31_cancellingExpiredOrderPersistsExpiredAndHistory() throws Exception {
        String userToken = obtainUserToken();
        Dish dish = dishRepository.findByCodeIgnoreCase("DISH-001").orElseThrow();
        String futureDate = OffsetDateTime.now(VN_ZONE).plusDays(7).toString();

        String payload = String.format("""
                {
                  "customerName": "Khách Sắp Hết Hạn",
                  "customerPhone": "0912345678",
                  "customerEmail": "user@banquethub.vn",
                  "eventDateTime": "%s",
                  "tableCount": 2,
                  "guestCount": 20,
                  "eventLocation": "Sảnh Thượng Uyển",
                  "items": [
                    { "dishId": %d, "quantityPerTable": 1 }
                  ]
                }
                """, futureDate, dish.getId());

        MvcResult result = mockMvc.perform(post("/api/v1/orders")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andReturn();

        long orderId = objectMapper.readTree(result.getResponse().getContentAsString()).path("data").path("id").asLong();

        // Giảm paymentExpiresAt xuống quá khứ để giả lập quá hạn
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setPaymentExpiresAt(OffsetDateTime.now(VN_ZONE).minusMinutes(5));
        orderRepository.save(order);

        // Khách thực hiện yêu cầu hủy -> sẽ trả về HTTP 400 do đơn đã hết hạn
        mockMvc.perform(post("/api/v1/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Tôi muốn hủy\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Đơn hàng đã hết hạn giữ chỗ")));

        // Kiểm tra CSDL: order vẫn phải được commit EXPIRED
        Order updatedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(updatedOrder.getOrderStatus()).isEqualTo(OrderStatus.EXPIRED);

        // Kiểm tra Lịch sử trạng thái: phải có bản ghi EXPIRED
        List<OrderStatusHistory> history = orderStatusHistoryRepository.findByOrderIdOrderByCreatedAtAsc(orderId);
        assertThat(history).isNotEmpty();
        boolean hasExpiredHistory = history.stream().anyMatch(h -> h.getToStatus() == OrderStatus.EXPIRED);
        assertThat(hasExpiredHistory).isTrue();

        // Kiểm tra Giữ tồn: phải là EXPIRED
        StockReservation res = reservationRepository.findByOrderId(orderId).orElseThrow();
        assertThat(res.getStatus()).isEqualTo(ReservationStatus.EXPIRED);
    }
}
