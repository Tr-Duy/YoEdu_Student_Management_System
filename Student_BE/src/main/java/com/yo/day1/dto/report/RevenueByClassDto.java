package com.yo.day1.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class RevenueByClassDto {
    private Long courseClassId;
    private String className;
    private BigDecimal totalFinalAmount;
    private BigDecimal totalAmountPaid;
    private BigDecimal totalBalance;
    private long totalInvoices;
}
