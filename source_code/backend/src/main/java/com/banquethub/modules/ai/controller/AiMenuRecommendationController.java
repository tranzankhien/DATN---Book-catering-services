package com.banquethub.modules.ai.controller;

import com.banquethub.common.dto.ApiResponse;
import com.banquethub.common.security.CustomUserDetails;
import com.banquethub.modules.ai.dto.AiMenuRecommendationRequest;
import com.banquethub.modules.ai.dto.AiMenuRecommendationResponse;
import com.banquethub.modules.ai.service.AiRecommendationService;
import com.banquethub.modules.users.entity.User;
import com.banquethub.modules.users.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/ai/menu")
@Tag(name = "AI Menu Recommendation", description = "Gợi ý thực đơn thông minh bằng Google Gemini AI kết hợp kiểm tra tồn kho & giá vốn")
public class AiMenuRecommendationController {

    private static final Logger log = LoggerFactory.getLogger(AiMenuRecommendationController.class);

    private final AiRecommendationService recommendationService;
    private final UserRepository userRepository;

    public AiMenuRecommendationController(AiRecommendationService recommendationService, UserRepository userRepository) {
        this.recommendationService = recommendationService;
        this.userRepository = userRepository;
    }

    @PostMapping("/recommendations")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Gợi ý thực đơn yến tiệc theo ngân sách, số bàn và khẩu vị bằng AI")
    public ResponseEntity<ApiResponse<AiMenuRecommendationResponse>> getRecommendations(
            @Valid @RequestBody AiMenuRecommendationRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null || userDetails.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để sử dụng tính năng gợi ý thực đơn thông minh.");
        }

        User currentUser = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Không tìm thấy thông tin tài khoản người dùng."));

        log.info("Processing AI menu recommendation request for user id={} (tables={}, guests={}, budget={})",
                currentUser.getId(), request.getTableCount(), request.getGuestsPerTable(), request.getBudgetAmount());

        try {
            AiMenuRecommendationResponse response = recommendationService.getRecommendations(request, currentUser);
            return ResponseEntity.ok(ApiResponse.ok("Gợi ý thực đơn thành công", response));
        } catch (Exception e) {
            log.error("AI recommendation failed for user id=" + currentUser.getId(), e);
            throw e;
        }
    }
}
