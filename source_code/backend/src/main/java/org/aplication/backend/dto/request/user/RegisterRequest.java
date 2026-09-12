package org.aplication.backend.dto.request.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.AssertTrue;
import org.aplication.backend.common.constants.RegexConstants;

public record RegisterRequest(
        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Pattern(regexp = RegexConstants.PHONE) String phone,
        @NotBlank @Size(min = 8, max = 72)
        @Pattern(regexp = RegexConstants.PASSWORD,
                message = "{validation.password.complexity}") String password,
        @NotBlank String confirmPassword) {
    @AssertTrue(message = "{validation.password.confirm}")
    public boolean isPasswordMatching() {
        return password != null && password.equals(confirmPassword);
    }
}
