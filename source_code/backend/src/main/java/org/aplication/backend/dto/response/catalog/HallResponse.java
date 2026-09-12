package org.aplication.backend.dto.response.catalog;

import java.util.UUID;

public record HallResponse(UUID id, String name, int capacityMin, int capacityMax,
                           String description, String imageUrl) {}
