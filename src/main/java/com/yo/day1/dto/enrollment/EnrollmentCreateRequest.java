package com.yo.day1.dto.enrollment;

import com.yo.day1.domain.enums.EnrollmentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class EnrollmentCreateRequest {
    @NotNull
    private Long studentId;

    @NotNull
    private Long courseClassId;

    @NotNull
    private LocalDate enrolledAt;

    @NotNull
    private EnrollmentStatus status;

    @Size(max = 255)
    private String note;
}
