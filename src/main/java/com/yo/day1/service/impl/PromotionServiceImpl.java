package com.yo.day1.service.impl;

import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.Promotion;
import com.yo.day1.dto.promotion.PromotionResponse;
import com.yo.day1.dto.promotion.PromotionUpsertRequest;
import com.yo.day1.repository.PromotionRepository;
import com.yo.day1.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final ModelMapper mapper;

    @Transactional(readOnly = true)
    @Override
    public List<PromotionResponse> findAll() {
        return promotionRepository.findAll()
                .stream()
                .map(p -> mapper.map(p, PromotionResponse.class))
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<PromotionResponse> findById(Long id) {
        return promotionRepository.findById(id)
                .map(p -> mapper.map(p, PromotionResponse.class));
    }

    @Transactional
    @Override
    public PromotionResponse save(PromotionUpsertRequest req) {
        Promotion promotion = mapper.map(req, Promotion.class);
        return mapper.map(promotionRepository.save(promotion), PromotionResponse.class);
    }

    @Transactional
    @Override
    public PromotionResponse update(Long id, PromotionUpsertRequest req) {
        Promotion existing = promotionRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Promotion not found: " + id));
        mapper.map(req, existing);
        return mapper.map(promotionRepository.save(existing), PromotionResponse.class);
    }

    @Transactional
    @Override
    public void delete(Long id) {
        if (!promotionRepository.existsById(id)) {
            throw new NotFoundExeception("Promotion not found: " + id);
        }
        promotionRepository.deleteById(id);
    }
}
