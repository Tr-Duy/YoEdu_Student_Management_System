package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.dto.Billing.PaymentResponse;
import com.yo.day1.service.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payments querying endpoints")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final BillingService billingService;

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF', 'CASHIER', 'PARENT')")
    @Operation(summary = "Get all payments (with optional student filter)")
    public ApiResponse<List<PaymentResponse>> getAllPayments(
            @RequestParam(required = false) Long studentId,
            Principal principal) {
        return ApiResponse.success(billingService.getAllPayments(studentId, principal.getName()));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF', 'CASHIER', 'PARENT')")
    @Operation(summary = "Get payment history of a student")
    public ApiResponse<List<PaymentResponse>> getPaymentHistory(
            @PathVariable Long studentId,
            Principal principal) throws BadRequestException, NotFoundExeception {
        return ApiResponse.success(billingService.getPaymentHistory(studentId, principal.getName()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF', 'CASHIER', 'PARENT')")
    @Operation(summary = "Get payment details by ID")
    public ApiResponse<PaymentResponse> getPaymentById(
            @PathVariable Long id,
            Principal principal) throws NotFoundExeception {
        return ApiResponse.success(billingService.getPaymentById(id, principal.getName()));
    }
}
