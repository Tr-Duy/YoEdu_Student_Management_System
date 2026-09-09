package com.yo.day1.dto.promotion;

import com.yo.day1.domain.enums.DiscountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PromotionUpsertRequest {
    @NotBlank(message = "Mã ưu đãi không được để trống")
    private String promoCode;

    @NotBlank(message = "Tên chương trình không được để trống")
    private String name;

    @NotNull(message = "Hình thức chiết khấu không được để trống")
    private DiscountType discountType;

    @NotNull(message = "Giá trị ưu đãi không được để trống")
    @jakarta.validation.constraints.DecimalMin(value = "0.01", message = "Giá trị ưu đãi phải lớn hơn 0")
    private java.math.BigDecimal discountValue;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDate endDate;

    private Boolean isActive = true;

    private String note;
}
