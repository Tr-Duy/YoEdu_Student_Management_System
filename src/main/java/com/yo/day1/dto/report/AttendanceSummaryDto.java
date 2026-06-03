package com.yo.day1.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AttendanceSummaryDto {
    private Long courseClassId;
    private String className;
    private int year;
    private int month;
    private long totalSessions;
    private long presentCount;
    private long absentCount;
    private long lateCount;
    private double attendanceRate; // % có mặt
}
