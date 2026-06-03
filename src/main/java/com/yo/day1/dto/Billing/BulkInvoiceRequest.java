package com.yo.day1.dto.Billing;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class BulkInvoiceRequest {

    @NotNull
    private Long studentId;

    @NotNull
    private Long courseClassId;

    @NotNull
    private LocalDate startMonth;

    @NotNull
    @Min(1) @Max(12)
    private Integer numberOfMonths;

    private BigDecimal originalAmount;

    private Long promotionId;
}
