package com.yo.day1.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TopAbsentStudentDto {
    private Long studentId;
    private String studentName;
    private String studentCode;
    private long absentCount;
}
