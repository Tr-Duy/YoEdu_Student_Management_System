package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.enums.InvoiceStatus;
import com.yo.day1.dto.Billing.*;
import com.yo.day1.service.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
@Tag(name = "Billing", description = "Invoice and tuition billing endpoints.")
@SecurityRequirement(name = "bearerAuth")
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/invoices")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','CASHIER')")
    @Operation(summary = "Create single invoice")
    public ApiResponse<InvoiceResponse> createInvoice(@Valid @RequestBody InvoiceCreateRequest request) {
        return ApiResponse.success(billingService.createInvoice(request), "Invoice created");
    }

    @PostMapping("/invoices/bulk")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','CASHIER')")
    @Operation(summary = "Create invoices for multiple months (pre-payment)")
    public ApiResponse<List<InvoiceResponse>> createInvoicesBulk(@Valid @RequestBody BulkInvoiceRequest request) {
        return ApiResponse.success(billingService.createInvoicesBulk(request), "Bulk invoices created");
    }

    @GetMapping("/students/{studentId}/invoices")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','CASHIER','PARENT')")
    @Operation(summary = "List invoices by student")
    public ApiResponse<List<InvoiceResponse>> findInvoicesByStudent(
            @Parameter(description = "Student identifier") @PathVariable Long studentId,
            @Parameter(hidden = true) Principal principal) throws BadRequestException, NotFoundExeception {
        return ApiResponse.success(billingService.findInvoicesByStudent(studentId, principal.getName()));
    }

    @PostMapping({"/invoices/payment", "/payments"})
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @Operation(summary = "Record a payment for an invoice (cash or bank transfer)")
    public ApiResponse<PaymentResponse> recordPayment(
            @Valid @RequestBody PaymentCreateRequest request,
            @Parameter(hidden = true) Principal principal) {
        return ApiResponse.success(billingService.recordPayment(request, principal.getName()), "Payment recorded");
    }

    @GetMapping("/students/{studentId}/payment-history")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','CASHIER','PARENT')")
    @Operation(summary = "Get payment history of a student")
    public ApiResponse<List<PaymentResponse>> getPaymentHistory(
            @PathVariable Long studentId,
            @Parameter(hidden = true) Principal principal) throws BadRequestException, NotFoundExeception {
        return ApiResponse.success(billingService.getPaymentHistory(studentId, principal.getName()));
    }

    @GetMapping("/invoices/overdue-warnings")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','CASHIER')")
    @Operation(summary = "Get list of invoices overdue more than 1 month")
    public ApiResponse<List<OverdueWarningResponse>> getOverdueWarnings() {
        return ApiResponse.success(billingService.getOverdueWarnings());
    }

    @GetMapping("/invoices/search")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','CASHIER')")
    @Operation(summary = "Search invoices globally")
    public ApiResponse<Page<InvoiceResponse>> searchInvoices(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) String month,
            Pageable pageable) {
        return ApiResponse.success(billingService.searchInvoices(search, studentId, classId, status, month, pageable));
    }

    @GetMapping("/invoices/stats")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','CASHIER')")
    @Operation(summary = "Get invoice statistics")
    public ApiResponse<InvoiceStatsResponse> getInvoiceStats(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long studentId,
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) String month) {
        return ApiResponse.success(billingService.getInvoiceStats(search, studentId, classId, status, month));
    }

}
