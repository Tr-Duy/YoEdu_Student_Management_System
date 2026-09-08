package com.yo.day1.service;

import com.yo.day1.dto.promotion.PromotionResponse;
import com.yo.day1.dto.promotion.PromotionUpsertRequest;

import java.util.List;
import java.util.Optional;

public interface PromotionService {
    List<PromotionResponse> findAll();
    Optional<PromotionResponse> findById(Long id);
    PromotionResponse save(PromotionUpsertRequest req);
    PromotionResponse update(Long id, PromotionUpsertRequest req);
    void delete(Long id);
}
