package org.aplication.backend.dto.response.shared;

import java.util.UUID;
import org.aplication.backend.common.enums.UserRole;
import org.aplication.backend.entity.auth.UserEntity;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long accessExpiresIn,
        long refreshExpiresIn,
        UserSummary user) {

    public record UserSummary(UUID id, String fullName, String email, String phone, UserRole role) {
        public static UserSummary from(UserEntity user) {
            return new UserSummary(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.getRole());
        }
    }
}
