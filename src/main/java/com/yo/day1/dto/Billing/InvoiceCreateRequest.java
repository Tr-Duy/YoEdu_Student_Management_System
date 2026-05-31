package com.yo.day1.dto.Billing;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class InvoiceCreateRequest {

    @NotNull
    String invoiceCode;

    @NotNull
    Long studentId;

    @NotNull
    Long courseClassId;

    @NotNull
    LocalDate billingMonth;

    @DecimalMin("0.0")
    BigDecimal originalAmount;

    Long promotionId;

    LocalDate dueDate;

    @Size(max = 255)
    String note;
}
