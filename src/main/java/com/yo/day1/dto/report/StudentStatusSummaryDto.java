package com.yo.day1.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StudentStatusSummaryDto {
    private long totalStudents;
    private long activeCount;
    private long pauseCount;
    private long droppedCount;
    private long graduatedCount;
}
