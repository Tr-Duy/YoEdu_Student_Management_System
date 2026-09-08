package com.yo.day1.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class LearningResultSummaryDto {
    private Long courseClassId;
    private String className;
    private int year;
    private int month;
    private long totalStudents;
    private BigDecimal averageScore;
    private BigDecimal maxScore;
    private BigDecimal minScore;
    private long excellentCount;  // >= 8.5
    private long goodCount;       // >= 7.0
    private long averageCount;    // >= 5.0
    private long weakCount;       // < 5.0
}
