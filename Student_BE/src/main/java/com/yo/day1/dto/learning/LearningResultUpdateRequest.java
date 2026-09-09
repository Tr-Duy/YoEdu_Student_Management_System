package com.yo.day1.dto.learning;

import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LearningResultUpdateRequest {
    @DecimalMin("0.0")
    @jakarta.validation.constraints.DecimalMax("10.0")
    BigDecimal score;
    String teacherComment;
}
