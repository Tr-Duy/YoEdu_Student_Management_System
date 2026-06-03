package com.yo.day1.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponseDto {
    // Standard dashboard fields
    private long totalStudents;
    private long activeStudents;
    private long pausedStudents;
    private long droppedStudents;
    private long totalTeachers;
    private long activeTeachers;
    private long totalClasses;
    private long ongoingClasses;
    private BigDecimal totalRevenue;
    private BigDecimal monthlyRevenue;

    // Prompt spec aliases for maximum client support
    private long studentsCount;
    private long coursesCount;
    private long classesCount;
    private BigDecimal currentMonthRevenue;
    private long unpaidInvoicesCount;
}
