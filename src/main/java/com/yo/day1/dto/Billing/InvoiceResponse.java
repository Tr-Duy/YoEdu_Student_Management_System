package com.yo.day1.dto.Billing;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class InvoiceResponse {

    Long id;
    String invoiceCode;
    Long studentId;
    String studentName;
    Long courseClassId;
    String className;
    LocalDate billingMonth;
    BigDecimal originalAmount;
    BigDecimal discountAmount;
    BigDecimal finalAmount;
    BigDecimal amountPaid;
    BigDecimal balanceAmount;
    String status;
    Long promotionId;
    String promotionName;
    LocalDate dueDate;
    String note;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
