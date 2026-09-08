package com.yo.day1.dto.learning;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class LearningResultResponse {
    Long id;
    Long studentId;
    String studentName;
    Long courseClassId;
    String className;
    LocalDate resultMonth;
    BigDecimal score;
    String teacherComment;
    Long createdByUserId;
    String createdByUsername;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
