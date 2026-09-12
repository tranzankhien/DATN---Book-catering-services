package org.aplication.backend.dto.response.shared;

import java.util.UUID;

public record RegistrationStartedResponse(UUID registrationId, long expiresInSeconds) {}
