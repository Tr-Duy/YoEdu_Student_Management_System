package com.yo.day1.service;

import com.yo.day1.dto.report.*;

import java.util.List;

public interface ReportService {
    List<RevenueByMonthDto> revenueByMonth(Integer year);
    List<RevenueByClassDto> revenueByClass(Integer year, Integer month);
    List<AttendanceSummaryDto> attendanceSummary(int year, int month, Long classId);
    List<TopAbsentStudentDto> topAbsentStudents(Integer year, Integer month, int limit);
    List<LearningResultSummaryDto> learningResultSummary(int year, int month, Long classId);
    StudentStatusSummaryDto studentStatusSummary();
    List<ClassEnrollmentSummaryDto> classEnrollmentSummary();
    DashboardStatsResponseDto getDashboardStats();
}
