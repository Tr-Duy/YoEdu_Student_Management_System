package com.yo.day1.dto.learning;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class LearningResultCreateRequest {
    @NotNull
    Long studentId;
    @NotNull
    Long courseClassId;
    @NotNull
    LocalDate resultMonth;
    @DecimalMin("0.0")
    BigDecimal score;
    String teacherComment;
}
