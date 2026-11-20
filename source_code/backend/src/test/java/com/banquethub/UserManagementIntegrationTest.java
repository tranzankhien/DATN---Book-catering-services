package com.banquethub;

import com.banquethub.modules.users.dto.*;
import com.banquethub.modules.users.entity.Role;
import com.banquethub.modules.users.entity.User;
import com.banquethub.modules.users.repository.UserRepository;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class UserManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String adminToken() throws Exception {
        return obtainToken("admin@banquethub.vn", "Admin@123");
    }

    private String userToken() throws Exception {
        return obtainToken("user@banquethub.vn", "User@123");
    }

    private String obtainToken(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("data").get("accessToken").asText();
    }

    @Test
    @Order(1)
    @DisplayName("TC-UM-01: Admin lấy danh sách tài khoản kèm phân trang và bộ lọc")
    void adminCanListUsersWithFiltersAndPagination() throws Exception {
        String token = adminToken();

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token)
                        .param("page", "0")
                        .param("size", "10")
                        .param("role", "ROLE_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content[0].email").value("admin@banquethub.vn"));
    }

    @Test
    @Order(2)
    @DisplayName("TC-UM-02: Non-Admin (ROLE_USER) bị chặn 403 khi truy cập API quản lý tài khoản")
    void nonAdminCannotAccessAdminEndpoints() throws Exception {
        String token = userToken();

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(3)
    @DisplayName("TC-UM-03: Admin tạo mới tài khoản thành công và chặn trùng email")
    void adminCanCreateUserAndRejectDuplicateEmail() throws Exception {
        String token = adminToken();
        String uniqueEmail = "testuser_" + System.currentTimeMillis() + "@banquethub.vn";

        CreateUserRequest req = new CreateUserRequest();
        req.setFullName("Người Dùng Thử Nghiệm");
        req.setEmail(uniqueEmail);
        req.setPassword("Password@123");
        req.setPhone("0988776655");
        req.setRole(Role.ROLE_USER);
        req.setActive(true);

        MvcResult result = mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(uniqueEmail))
                .andReturn();

        // Chặn trùng email
        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    @Order(4)
    @DisplayName("TC-UM-04: Admin chỉnh sửa thông tin tài khoản")
    void adminCanUpdateUser() throws Exception {
        String token = adminToken();
        String email = "update_test_" + System.currentTimeMillis() + "@banquethub.vn";

        CreateUserRequest req = new CreateUserRequest();
        req.setFullName("Tài Khoản Trước Sửa");
        req.setEmail(email);
        req.setPassword("Password@123");
        req.setRole(Role.ROLE_USER);

        MvcResult createRes = mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        Long userId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("data").get("id").asLong();

        UpdateUserRequest updateReq = new UpdateUserRequest();
        updateReq.setFullName("Tài Khoản Sau Sửa");
        updateReq.setPhone("0912345678");
        updateReq.setRole(Role.ROLE_EMPLOYEE);
        updateReq.setActive(true);

        mockMvc.perform(put("/api/v1/admin/users/" + userId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Tài Khoản Sau Sửa"))
                .andExpect(jsonPath("$.data.role").value("ROLE_EMPLOYEE"));
    }

    @Test
    @Order(5)
    @DisplayName("TC-UM-05: Admin không thể tự hạ quyền quản trị viên của chính mình")
    void adminCannotDemoteSelf() throws Exception {
        String token = adminToken();
        User admin = userRepository.findByEmailIgnoreCase("admin@banquethub.vn").orElseThrow();

        UpdateUserRequest req = new UpdateUserRequest();
        req.setFullName(admin.getFullName());
        req.setRole(Role.ROLE_USER); // Cố tình hạ quyền

        mockMvc.perform(put("/api/v1/admin/users/" + admin.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("BUSINESS_RULE_VIOLATION"));
    }

    @Test
    @Order(6)
    @DisplayName("TC-UM-06: Khóa tài khoản thành công và chặn người dùng bị khóa đăng nhập")
    void adminCanLockUserAndLockedUserCannotLogin() throws Exception {
        String token = adminToken();
        String email = "lock_test_" + System.currentTimeMillis() + "@banquethub.vn";

        CreateUserRequest req = new CreateUserRequest();
        req.setFullName("Tài Khoản Sắp Bị Khóa");
        req.setEmail(email);
        req.setPassword("Password@123");
        req.setRole(Role.ROLE_USER);

        MvcResult createRes = mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        Long userId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Khóa tài khoản
        UpdateUserStatusRequest statusReq = new UpdateUserStatusRequest(false, "Vi phạm quy chế");
        mockMvc.perform(patch("/api/v1/admin/users/" + userId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(false));

        // Thử đăng nhập tài khoản vừa bị khóa -> Thất bại
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", "Password@123"))))
                .andExpect(status().isUnauthorized());

        // Mở khóa lại
        statusReq.setActive(true);
        mockMvc.perform(patch("/api/v1/admin/users/" + userId + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(true));

        // Đăng nhập lại thành công
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", "Password@123"))))
                .andExpect(status().isOk());
    }

    @Test
    @Order(7)
    @DisplayName("TC-UM-07: Admin không thể tự khóa tài khoản của chính mình")
    void adminCannotLockSelf() throws Exception {
        String token = adminToken();
        User admin = userRepository.findByEmailIgnoreCase("admin@banquethub.vn").orElseThrow();

        UpdateUserStatusRequest statusReq = new UpdateUserStatusRequest(false, "Tự khóa");
        mockMvc.perform(patch("/api/v1/admin/users/" + admin.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("BUSINESS_RULE_VIOLATION"));
    }

    @Test
    @Order(8)
    @DisplayName("TC-UM-08: Admin đặt lại mật khẩu cho tài khoản người dùng an toàn")
    void adminCanResetPassword() throws Exception {
        String token = adminToken();
        String email = "reset_test_" + System.currentTimeMillis() + "@banquethub.vn";

        CreateUserRequest req = new CreateUserRequest();
        req.setFullName("Tài Khoản Cần Reset Pass");
        req.setEmail(email);
        req.setPassword("Password@123");
        req.setRole(Role.ROLE_USER);

        MvcResult createRes = mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        Long userId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("data").get("id").asLong();

        // Reset với mật khẩu mới tự chọn
        AdminResetPasswordRequest resetReq = new AdminResetPasswordRequest("NewPass@2026");
        MvcResult resetRes = mockMvc.perform(post("/api/v1/admin/users/" + userId + "/reset-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.newPassword").value("NewPass@2026"))
                .andReturn();

        // Đăng nhập bằng mật khẩu mới -> thành công
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", "NewPass@2026"))))
                .andExpect(status().isOk());
    }

    @Test
    @Order(9)
    @DisplayName("TC-UM-09: Xem chi tiết tài khoản kèm lịch sử đơn hàng và nhân viên liên kết")
    void adminCanViewUserDetail() throws Exception {
        String token = adminToken();
        User user = userRepository.findByEmailIgnoreCase("user@banquethub.vn").orElseThrow();

        mockMvc.perform(get("/api/v1/admin/users/" + user.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(user.getId()))
                .andExpect(jsonPath("$.data.email").value("user@banquethub.vn"))
                .andExpect(jsonPath("$.data.totalOrders").isNumber())
                .andExpect(jsonPath("$.data.recentOrders").isArray());
    }

    @Test
    @Order(10)
    @DisplayName("TC-UM-10: Người dùng tự xem và cập nhật hồ sơ cá nhân")
    void userCanViewAndUpdateProfile() throws Exception {
        String token = userToken();

        // Xem profile
        mockMvc.perform(get("/api/v1/users/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("user@banquethub.vn"));

        // Cập nhật profile
        UpdateProfileRequest updateReq = new UpdateProfileRequest("Nguyễn Minh Khách Hàng Mới", "0909999888");
        mockMvc.perform(put("/api/v1/users/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Nguyễn Minh Khách Hàng Mới"))
                .andExpect(jsonPath("$.data.phone").value("0909999888"));
    }

    @Test
    @Order(11)
    @DisplayName("TC-UM-11: Người dùng tự đổi mật khẩu (yêu cầu mật khẩu hiện tại)")
    void userCanChangePassword() throws Exception {
        String token = userToken();

        // Sai mật khẩu hiện tại -> 401
        ChangePasswordRequest wrongOldReq = new ChangePasswordRequest("WrongPass@123", "UserNew@456", "UserNew@456");
        mockMvc.perform(post("/api/v1/users/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongOldReq)))
                .andExpect(status().isUnauthorized());

        // Đổi mật khẩu đúng
        ChangePasswordRequest validReq = new ChangePasswordRequest("User@123", "UserNew@456", "UserNew@456");
        mockMvc.perform(post("/api/v1/users/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validReq)))
                .andExpect(status().isOk());

        // Đăng nhập bằng mật khẩu mới
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "user@banquethub.vn", "password", "UserNew@456"))))
                .andExpect(status().isOk());

        // Đổi ngược lại mật khẩu ban đầu để không ảnh hưởng test suite khác
        String newToken = obtainToken("user@banquethub.vn", "UserNew@456");
        ChangePasswordRequest revertReq = new ChangePasswordRequest("UserNew@456", "User@123", "User@123");
        mockMvc.perform(post("/api/v1/users/change-password")
                        .header("Authorization", "Bearer " + newToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(revertReq)))
                .andExpect(status().isOk());
    }

    @Test
    @Order(12)
    @DisplayName("TC-UM-12: Chặn xóa vĩnh viễn tài khoản đã có đơn hàng")
    void cannotDeleteUserWithOrders() throws Exception {
        String token = adminToken();
        User user = userRepository.findByEmailIgnoreCase("user@banquethub.vn").orElseThrow();

        mockMvc.perform(delete("/api/v1/admin/users/" + user.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("BUSINESS_RULE_VIOLATION"));
    }
}
