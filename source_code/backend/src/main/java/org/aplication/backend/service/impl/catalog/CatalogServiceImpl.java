package org.aplication.backend.service.impl.catalog;

import java.util.List;
import java.util.UUID;
import org.aplication.backend.common.constants.ErrorCode;
import org.aplication.backend.common.exception.CustomBusinessException;
import org.aplication.backend.dto.response.catalog.AdditionalServiceResponse;
import org.aplication.backend.dto.response.catalog.BusinessProfileResponse;
import org.aplication.backend.dto.response.catalog.DishCategoryResponse;
import org.aplication.backend.dto.response.catalog.DishResponse;
import org.aplication.backend.dto.response.catalog.HallResponse;
import org.aplication.backend.mapper.catalog.CatalogMapper;
import org.aplication.backend.repository.catalog.AdditionalServiceRepository;
import org.aplication.backend.repository.catalog.BusinessProfileRepository;
import org.aplication.backend.repository.catalog.DishCategoryRepository;
import org.aplication.backend.repository.catalog.DishRepository;
import org.aplication.backend.repository.catalog.HallRepository;
import org.aplication.backend.service.interfaces.catalog.CatalogService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class CatalogServiceImpl implements CatalogService {
    private final BusinessProfileRepository profileRepository;
    private final HallRepository hallRepository;
    private final DishCategoryRepository categoryRepository;
    private final DishRepository dishRepository;
    private final AdditionalServiceRepository serviceRepository;
    private final CatalogMapper mapper;

    public CatalogServiceImpl(BusinessProfileRepository profileRepository, HallRepository hallRepository,
                              DishCategoryRepository categoryRepository, DishRepository dishRepository,
                              AdditionalServiceRepository serviceRepository, CatalogMapper mapper) {
        this.profileRepository = profileRepository; this.hallRepository = hallRepository;
        this.categoryRepository = categoryRepository; this.dishRepository = dishRepository;
        this.serviceRepository = serviceRepository; this.mapper = mapper;
    }

    @Override public BusinessProfileResponse getBusinessProfile() {
        return profileRepository.findFirstByOrderByCreatedAtAsc().map(mapper::toResponse)
                .orElseThrow(() -> new CustomBusinessException(ErrorCode.BUSINESS_PROFILE_NOT_FOUND));
    }
    @Override public List<HallResponse> getHalls() { return hallRepository.findByActiveTrueOrderByNameAsc().stream().map(mapper::toResponse).toList(); }
    @Override public List<DishCategoryResponse> getCategories() { return categoryRepository.findByActiveTrueOrderByDisplayOrderAscNameAsc().stream().map(mapper::toResponse).toList(); }
    @Override public List<DishResponse> getDishes(UUID categoryId, String keyword) {
        var dishes = categoryId != null ? dishRepository.findByActiveTrueAndCategoryIdOrderByNameAsc(categoryId)
                : keyword != null && !keyword.isBlank() ? dishRepository.findByActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(keyword.trim())
                : dishRepository.findByActiveTrueOrderByNameAsc();
        return dishes.stream().map(mapper::toResponse).toList();
    }
    @Override public List<AdditionalServiceResponse> getAdditionalServices() { return serviceRepository.findByActiveTrueOrderByNameAsc().stream().map(mapper::toResponse).toList(); }
}
