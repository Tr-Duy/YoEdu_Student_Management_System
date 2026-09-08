package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.dto.report.*;
import com.yo.day1.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Báo cáo thống kê")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','CASHIER')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard-stats")
    @Operation(summary = "Lấy thống kê dashboard")
    public ApiResponse<DashboardStatsResponseDto> getDashboardStats() {
        return ApiResponse.success(reportService.getDashboardStats());
    }

    @GetMapping("/revenue/monthly")
    @Operation(summary = "Biểu đồ doanh thu tháng")
    public ApiResponse<List<RevenueByMonthDto>> revenueMonthly(
            @RequestParam(required = false) Integer year) {
        return ApiResponse.success(reportService.revenueByMonth(year));
    }

    @GetMapping("/revenue/course")
    @Operation(summary = "Biểu đồ doanh thu theo khóa")
    public ApiResponse<List<RevenueByClassDto>> revenueCourse(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ApiResponse.success(reportService.revenueByClass(year, month));
    }

    @GetMapping("/revenue/by-month")
    @Operation(summary = "Doanh thu theo tháng", description = "Truyền year để lọc theo năm, bỏ trống để lấy tất cả")
    public ApiResponse<List<RevenueByMonthDto>> revenueByMonth(
            @RequestParam(required = false) Integer year) {
        return ApiResponse.success(reportService.revenueByMonth(year));
    }

    @GetMapping("/revenue/by-class")
    @Operation(summary = "Doanh thu theo lớp", description = "Lọc theo year và/hoặc month")
    public ApiResponse<List<RevenueByClassDto>> revenueByClass(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ApiResponse.success(reportService.revenueByClass(year, month));
    }

    @GetMapping("/attendance/summary")
    @Operation(summary = "Tổng hợp điểm danh theo lớp/tháng", description = "classId tùy chọn để lọc 1 lớp cụ thể")
    public ApiResponse<List<AttendanceSummaryDto>> attendanceSummary(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Long classId) {
        return ApiResponse.success(reportService.attendanceSummary(year, month, classId));
    }

    @GetMapping("/attendance/top-absent")
    @Operation(summary = "Top học viên vắng nhiều nhất", description = "Mặc định top 10, lọc theo year/month tùy chọn")
    public ApiResponse<List<TopAbsentStudentDto>> topAbsentStudents(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.success(reportService.topAbsentStudents(year, month, limit));
    }

    @GetMapping("/learning/summary")
    @Operation(summary = "Tổng hợp học lực theo lớp/tháng", description = "classId tùy chọn để lọc 1 lớp cụ thể")
    public ApiResponse<List<LearningResultSummaryDto>> learningResultSummary(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Long classId) {
        return ApiResponse.success(reportService.learningResultSummary(year, month, classId));
    }

    @GetMapping("/students/status-summary")
    @Operation(summary = "Thống kê tình trạng học viên")
    public ApiResponse<StudentStatusSummaryDto> studentStatusSummary() {
        return ApiResponse.success(reportService.studentStatusSummary());
    }

    @GetMapping("/classes/enrollment-summary")
    @Operation(summary = "Sĩ số và tỷ lệ lấp đầy từng lớp")
    public ApiResponse<List<ClassEnrollmentSummaryDto>> classEnrollmentSummary() {
        return ApiResponse.success(reportService.classEnrollmentSummary());
    }
}
