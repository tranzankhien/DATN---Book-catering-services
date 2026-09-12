package org.aplication.backend.controller.publicapi;

import java.util.List;
import java.util.UUID;
import org.aplication.backend.dto.response.catalog.AdditionalServiceResponse;
import org.aplication.backend.dto.response.catalog.BusinessProfileResponse;
import org.aplication.backend.dto.response.catalog.DishCategoryResponse;
import org.aplication.backend.dto.response.catalog.DishResponse;
import org.aplication.backend.dto.response.catalog.HallResponse;
import org.aplication.backend.service.interfaces.catalog.CatalogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
    private final CatalogService service;
    public CatalogController(CatalogService service) { this.service = service; }
    @GetMapping("/business") public BusinessProfileResponse business() { return service.getBusinessProfile(); }
    @GetMapping("/halls") public List<HallResponse> halls() { return service.getHalls(); }
    @GetMapping("/categories") public List<DishCategoryResponse> categories() { return service.getCategories(); }
    @GetMapping("/dishes") public List<DishResponse> dishes(@RequestParam(required = false) UUID categoryId,
                                                              @RequestParam(required = false) String keyword) { return service.getDishes(categoryId, keyword); }
    @GetMapping("/services") public List<AdditionalServiceResponse> services() { return service.getAdditionalServices(); }
}
