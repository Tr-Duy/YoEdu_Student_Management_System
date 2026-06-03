package com.yo.day1.dto.enrollment;

import com.yo.day1.domain.enums.EnrollmentStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class EnrollmentResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long courseClassId;
    private String className;
    private LocalDate enrolledAt;
    private String status;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
