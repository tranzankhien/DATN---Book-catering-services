package org.aplication.backend.mapper.catalog;

import org.aplication.backend.dto.response.catalog.AdditionalServiceResponse;
import org.aplication.backend.dto.response.catalog.BusinessProfileResponse;
import org.aplication.backend.dto.response.catalog.DishCategoryResponse;
import org.aplication.backend.dto.response.catalog.DishResponse;
import org.aplication.backend.dto.response.catalog.HallResponse;
import org.aplication.backend.entity.catalog.AdditionalServiceEntity;
import org.aplication.backend.entity.catalog.BusinessProfileEntity;
import org.aplication.backend.entity.catalog.DishCategoryEntity;
import org.aplication.backend.entity.catalog.DishEntity;
import org.aplication.backend.entity.catalog.HallEntity;
import org.springframework.stereotype.Component;

@Component
public class CatalogMapper {
    public BusinessProfileResponse toResponse(BusinessProfileEntity e) {
        return new BusinessProfileResponse(e.getName(), e.getPhone(), e.getEmail(), e.getAddress(),
                e.getDescription(), e.getImageUrl(), e.getServiceRadiusKm());
    }
    public HallResponse toResponse(HallEntity e) {
        return new HallResponse(e.getId(), e.getName(), e.getCapacityMin(), e.getCapacityMax(),
                e.getDescription(), e.getImageUrl());
    }
    public DishCategoryResponse toResponse(DishCategoryEntity e) {
        return new DishCategoryResponse(e.getId(), e.getName(), e.getDisplayOrder());
    }
    public DishResponse toResponse(DishEntity e) {
        return new DishResponse(e.getId(), e.getCategory().getId(), e.getCategory().getName(), e.getName(),
                e.getDescription(), e.getImageUrl(), e.getSalePrice(), e.getServingUnit());
    }
    public AdditionalServiceResponse toResponse(AdditionalServiceEntity e) {
        return new AdditionalServiceResponse(e.getId(), e.getName(), e.getDescription(),
                e.getPrice(), e.getPricingUnit());
    }
}
