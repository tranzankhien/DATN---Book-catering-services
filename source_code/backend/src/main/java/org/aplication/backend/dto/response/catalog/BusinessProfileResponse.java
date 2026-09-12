package org.aplication.backend.dto.response.catalog;

public record BusinessProfileResponse(String name, String phone, String email, String address,
                                      String description, String imageUrl, int serviceRadiusKm) {}
