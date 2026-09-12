package org.aplication.backend.dto.request.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;
import org.aplication.backend.common.constants.RegexConstants;

public record VerifyRegistrationRequest(
        @NotNull UUID registrationId,
        @NotBlank @Pattern(regexp = RegexConstants.OTP, message = "{validation.otp.format}") String code) {}
