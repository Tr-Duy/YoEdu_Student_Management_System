package com.yo.day1.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class RevenueByMonthDto {
    private int year;
    private int month;
    private BigDecimal totalFinalAmount;
    private BigDecimal totalAmountPaid;
    private BigDecimal totalBalance;
    private long totalInvoices;
    private long paidInvoices;
    private long unpaidInvoices;
}
