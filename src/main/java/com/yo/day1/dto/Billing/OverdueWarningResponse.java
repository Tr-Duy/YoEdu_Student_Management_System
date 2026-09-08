package com.yo.day1.dto.Billing;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class OverdueWarningResponse {
    private Long invoiceId;
    private String invoiceCode;
    private Long studentId;
    private String studentName;
    private Long courseClassId;
    private String className;
    private LocalDate billingMonth;
    private LocalDate dueDate;
    private BigDecimal balanceAmount;
    private long overdueDays;
}
