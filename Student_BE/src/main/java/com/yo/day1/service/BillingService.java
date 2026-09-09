package com.yo.day1.service;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.enums.InvoiceStatus;
import com.yo.day1.dto.Billing.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface BillingService {
    InvoiceResponse createInvoice(InvoiceCreateRequest request);
    List<InvoiceResponse> createInvoicesBulk(BulkInvoiceRequest request);
    List<InvoiceResponse> findInvoicesByStudent(Long studentId, String username) throws BadRequestException, NotFoundExeception;
    PaymentResponse recordPayment(PaymentCreateRequest request, String receivedBy);
    List<PaymentResponse> getPaymentHistory(Long studentId, String username) throws BadRequestException, NotFoundExeception;
    List<PaymentResponse> getAllPayments(Long studentId, String username);
    PaymentResponse getPaymentById(Long id, String username);
    List<OverdueWarningResponse> getOverdueWarnings();
    Page<InvoiceResponse> searchInvoices(String search, Long studentId, Long classId, InvoiceStatus status, String month, Pageable pageable);
    InvoiceStatsResponse getInvoiceStats(String search, Long studentId, Long classId, InvoiceStatus status, String month);
}
