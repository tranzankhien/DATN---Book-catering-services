package org.aplication.backend.dto.response.catalog;

import java.math.BigDecimal;
import java.util.UUID;

public record DishResponse(UUID id, UUID categoryId, String categoryName, String name,
                           String description, String imageUrl, BigDecimal salePrice,
                           String servingUnit) {}
