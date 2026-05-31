package com.yo.day1.service;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.dto.Billing.*;

import java.util.List;

public interface BillingService {
    InvoiceResponse createInvoice(InvoiceCreateRequest request);
    List<InvoiceResponse> createInvoicesBulk(BulkInvoiceRequest request);
    List<InvoiceResponse> findInvoicesByStudent(Long studentId, String username) throws BadRequestException, NotFoundExeception;
    PaymentResponse recordPayment(PaymentCreateRequest request, String receivedBy);
    List<PaymentResponse> getPaymentHistory(Long studentId, String username) throws BadRequestException, NotFoundExeception;
    List<OverdueWarningResponse> getOverdueWarnings();
}
