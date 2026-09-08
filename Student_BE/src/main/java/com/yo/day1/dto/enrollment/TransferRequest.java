package com.yo.day1.dto.enrollment;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record TransferRequest(
        @NotNull Long studentId,
        @NotNull Long fromClassId,
        @NotNull Long toClassId,
        String reason,
        LocalDate effectiveDate
) {}
