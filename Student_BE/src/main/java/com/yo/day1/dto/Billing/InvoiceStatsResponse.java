package com.yo.day1.dto.Billing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceStatsResponse {
    private long totalInvoicesCount;
    private BigDecimal totalPaidAmount;
    private BigDecimal totalUnpaidAmount;
    private long overdueCount;
}
