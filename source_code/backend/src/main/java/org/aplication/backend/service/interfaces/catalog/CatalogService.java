package org.aplication.backend.service.interfaces.catalog;

import java.util.List;
import java.util.UUID;
import org.aplication.backend.dto.response.catalog.AdditionalServiceResponse;
import org.aplication.backend.dto.response.catalog.BusinessProfileResponse;
import org.aplication.backend.dto.response.catalog.DishCategoryResponse;
import org.aplication.backend.dto.response.catalog.DishResponse;
import org.aplication.backend.dto.response.catalog.HallResponse;

public interface CatalogService {
    BusinessProfileResponse getBusinessProfile();
    List<HallResponse> getHalls();
    List<DishCategoryResponse> getCategories();
    List<DishResponse> getDishes(UUID categoryId, String keyword);
    List<AdditionalServiceResponse> getAdditionalServices();
}
