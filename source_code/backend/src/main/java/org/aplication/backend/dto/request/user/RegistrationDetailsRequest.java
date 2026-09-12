package org.aplication.backend.dto.request.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record RegistrationDetailsRequest(
        @NotNull UUID registrationId,
        @NotBlank @Size(max = 500) String address,
        @NotNull CustomerType customerType,
        @Size(max = 200) String companyName) {
    public enum CustomerType {
        INDIVIDUAL, BUSINESS
    }
}
