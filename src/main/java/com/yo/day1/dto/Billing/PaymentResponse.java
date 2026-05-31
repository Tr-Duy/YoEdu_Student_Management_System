package com.yo.day1.dto.Billing;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentResponse {
    private Long id;
    private Long invoiceId;
    private String invoiceCode;
    private String paymentCode;
    private BigDecimal paidAmount;
    private String paymentMethod;
    private LocalDateTime paidAt;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
