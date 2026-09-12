package org.aplication.backend.dto.response.catalog;

import java.util.UUID;

public record DishCategoryResponse(UUID id, String name, int displayOrder) {}
