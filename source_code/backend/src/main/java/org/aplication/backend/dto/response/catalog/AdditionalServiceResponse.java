package org.aplication.backend.dto.response.catalog;

import java.math.BigDecimal;
import java.util.UUID;

public record AdditionalServiceResponse(UUID id, String name, String description,
                                        BigDecimal price, String pricingUnit) {}
