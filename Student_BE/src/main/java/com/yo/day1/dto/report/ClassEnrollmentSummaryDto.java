package com.yo.day1.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ClassEnrollmentSummaryDto {
    private Long courseClassId;
    private String classCode;
    private String className;
    private String status;
    private int maxStudents;
    private long enrolledCount;
    private double fillRate; // % lấp đầy
}
