package org.aplication.backend.mapper.shared;

import org.aplication.backend.dto.response.shared.AuthResponse;
import org.aplication.backend.entity.auth.UserEntity;
import org.aplication.backend.common.constants.SystemConstants;
import org.springframework.stereotype.Component;

/** Converts authentication entities/results to API response DTOs. */
@Component
public class AuthMapper {
    public AuthResponse toResponse(UserEntity user, String accessToken, long accessTtlSeconds,
                                  long refreshTtlSeconds) {
        return new AuthResponse(accessToken, SystemConstants.BEARER_TOKEN_TYPE, accessTtlSeconds, refreshTtlSeconds,
                new AuthResponse.UserSummary(user.getId(), user.getFullName(), user.getEmail(),
                        user.getPhone(), user.getRole()));
    }
}
