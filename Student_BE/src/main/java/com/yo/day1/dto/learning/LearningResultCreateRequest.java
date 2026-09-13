package com.yo.day1.dto.learning;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class LearningResultCreateRequest {
    @NotNull(message = "studentId is required")
    private Long studentId;

    @NotNull(message = "courseClassId is required")
    private Long courseClassId;

    @DecimalMin(value = "0.0", message = "Điểm quá trình phải từ 0 đến 10")
    @DecimalMax(value = "10.0", message = "Điểm quá trình phải từ 0 đến 10")
    private BigDecimal processScore;

    @DecimalMin(value = "0.0", message = "Điểm giữa kỳ phải từ 0 đến 10")
    @DecimalMax(value = "10.0", message = "Điểm giữa kỳ phải từ 0 đến 10")
    private BigDecimal midtermScore;

    @DecimalMin(value = "0.0", message = "Điểm cuối kỳ phải từ 0 đến 10")
    @DecimalMax(value = "10.0", message = "Điểm cuối kỳ phải từ 0 đến 10")
    private BigDecimal finalScore;

    private String teacherComment;
}
