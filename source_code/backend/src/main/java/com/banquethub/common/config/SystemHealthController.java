package com.banquethub.common.config;

import com.banquethub.common.dto.ApiResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class SystemHealthController {

    private final JdbcTemplate jdbcTemplate;

    public SystemHealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> checkHealth() {
        Integer one = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        boolean dbUp = (one != null && one == 1);

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("status", dbUp ? "UP" : "DOWN");
        details.put("service", "banquet-hub-api");
        details.put("phase", "Phase 1 MVP");
        details.put("database", dbUp ? "PostgreSQL Connected" : "Disconnected");
        details.put("timezone", "Asia/Ho_Chi_Minh");
        details.put("serverTime", OffsetDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")));

        return ApiResponse.ok("Hệ thống hoạt động bình thường", details);
    }
}
