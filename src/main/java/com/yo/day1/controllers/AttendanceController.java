package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.dto.attendance.AttendanceBatchRequest;
import com.yo.day1.dto.attendance.AttendanceCreateRequest;
import com.yo.day1.dto.attendance.AttendanceResponse;
import com.yo.day1.dto.attendance.StudentAttendanceRowDto;
import com.yo.day1.dto.student.StudentResponse;
import com.yo.day1.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/attendances")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ApiResponse<AttendanceResponse> create(@Valid @RequestBody AttendanceCreateRequest request, Principal principal) {
        return ApiResponse.success(attendanceService.create(request, principal.getName()), "Attendance created");
    }

    @PostMapping("/batch")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ApiResponse<List<AttendanceResponse>> saveBatch(@Valid @RequestBody AttendanceBatchRequest request, Principal principal) {
        return ApiResponse.success(attendanceService.saveBatch(request, principal.getName()), "Attendance saved");
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ApiResponse<List<AttendanceResponse>> findByClassId(@PathVariable Long classId) {
        return ApiResponse.success(attendanceService.findByClassId(classId));
    }

    @GetMapping("/matrix/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ApiResponse<List<StudentAttendanceRowDto>> getMatrix(@PathVariable Long classId,
            @RequestParam int year, @RequestParam int month) {
        return ApiResponse.success(attendanceService.getAttendanceMatrix(classId, year, month));
    }

    /** Danh sách học viên hợp lệ để điểm danh: enrollment ACTIVE + student ACTIVE */
    @GetMapping("/eligible-students/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ApiResponse<List<StudentResponse>> getEligibleStudents(@PathVariable Long classId) {
        return ApiResponse.success(attendanceService.getEligibleStudents(classId));
    }
}
