package com.yo.day1.dto.student;

import com.yo.day1.domain.enums.StudentStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeStudentStatusRequest(
        @NotNull StudentStatus status,
        String reason
) {}
