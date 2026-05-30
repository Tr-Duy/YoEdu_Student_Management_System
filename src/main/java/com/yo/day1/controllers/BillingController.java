package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.dto.invoice.InvoiceCreateRequest;
import com.yo.day1.dto.invoice.InvoiceResponse;
import com.yo.day1.service.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
    @Operation(summary = "Create invoice")
    public ApiResponse<InvoiceResponse> createInvoice(@Valid @RequestBody InvoiceCreateRequest request) {
        return ApiResponse.success(billingService.createInvoice(request), "Invoice created");
    }

    @GetMapping("/students/{studentId}/invoices")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','CASHIER','PARENT')")
    @Operation(summary = "List invoices by student")
    public ApiResponse<List<InvoiceResponse>> findInvoicesByStudent(
            @Parameter(description = "Student identifier") @PathVariable Long studentId,
            @Parameter(hidden = true) Principal principal) throws BadRequestException, NotFoundExeception {
        return ApiResponse.success(billingService.findInvoicesByStudent(studentId, principal.getName()));
    }
}
