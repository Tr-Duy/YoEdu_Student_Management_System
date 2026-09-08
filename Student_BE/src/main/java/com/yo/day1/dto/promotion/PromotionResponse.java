package com.yo.day1.dto.promotion;

import com.yo.day1.domain.enums.DiscountType;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class PromotionResponse {
    private Long id;
    private String promoCode;
    private String name;
    private DiscountType discountType;
    private float discountValue;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isActive;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
