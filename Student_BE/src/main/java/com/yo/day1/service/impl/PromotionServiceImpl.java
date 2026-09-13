package com.yo.day1.service.impl;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.ConflictException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.Promotion;
import com.yo.day1.domain.enums.DiscountType;
import com.yo.day1.dto.promotion.PromotionResponse;
import com.yo.day1.dto.promotion.PromotionUpsertRequest;
import com.yo.day1.repository.PromotionRepository;
import com.yo.day1.repository.TuitionInvoiceRepository;
import com.yo.day1.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final TuitionInvoiceRepository tuitionInvoiceRepository;
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
        validatePromotionRequest(req, null);

        Promotion promotion = mapper.map(req, Promotion.class);
        promotion.setPromoCode(req.getPromoCode().trim());
        promotion.setName(req.getName().trim());
        return mapper.map(promotionRepository.save(promotion), PromotionResponse.class);
    }

    @Transactional
    @Override
    public PromotionResponse update(Long id, PromotionUpsertRequest req) {
        Promotion existing = promotionRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Promotion not found: " + id));

        validatePromotionRequest(req, existing);

        mapper.map(req, existing);
        existing.setPromoCode(req.getPromoCode().trim());
        existing.setName(req.getName().trim());
        return mapper.map(promotionRepository.save(existing), PromotionResponse.class);
    }

    @Transactional
    @Override
    public void delete(Long id) {
        if (!promotionRepository.existsById(id)) {
            throw new NotFoundExeception("Promotion not found: " + id);
        }
        if (tuitionInvoiceRepository != null && tuitionInvoiceRepository.existsByPromotionId(id)) {
            throw new ConflictException("Không thể xóa chương trình khuyến mãi đã được áp dụng vào hóa đơn.");
        }
        promotionRepository.deleteById(id);
    }

    private void validatePromotionRequest(PromotionUpsertRequest req, Promotion existing) {
        if (req.getPromoCode() == null || req.getPromoCode().trim().isEmpty()) {
            throw new BadRequestException("Mã khuyến mãi không được để trống");
        }
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new BadRequestException("Tên khuyến mãi không được để trống");
        }
        if (req.getStartDate() != null && req.getEndDate() != null && req.getEndDate().isBefore(req.getStartDate())) {
            throw new BadRequestException("Ngày kết thúc không được trước ngày bắt đầu");
        }
        if (req.getDiscountValue() != null) {
            if (req.getDiscountValue().compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Giá trị khuyến mãi không được âm");
            }
            if (req.getDiscountType() == DiscountType.PERCENT && req.getDiscountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new BadRequestException("Tỷ lệ giảm giá không được vượt quá 100%");
            }
        }

        String code = req.getPromoCode().trim();
        if (existing == null) {
            if (promotionRepository.existsByPromoCode(code)) {
                throw new ConflictException("Mã khuyến mãi đã tồn tại: " + code);
            }
        } else if (existing.getPromoCode() != null && !existing.getPromoCode().equalsIgnoreCase(code)) {
            if (promotionRepository.existsByPromoCode(code)) {
                throw new ConflictException("Mã khuyến mãi đã tồn tại: " + code);
            }
        }
    }
}
