package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.dto.enrollment.EnrollmentCreateRequest;
import com.yo.day1.dto.enrollment.EnrollmentResponse;
import com.yo.day1.dto.enrollment.TransferRequest;
import com.yo.day1.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    /** Đăng ký học viên vào lớp */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF')")
    public ApiResponse<EnrollmentResponse> enroll(@Valid @RequestBody EnrollmentCreateRequest request) throws Exception {
        return ApiResponse.success(enrollmentService.create(request), "Đăng ký thành công");
    }

    /** Hủy đăng ký */
    @PatchMapping("/{id}/drop")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF')")
    public ApiResponse<EnrollmentResponse> drop(@PathVariable Long id) throws Exception {
        return ApiResponse.success(enrollmentService.drop(id), "Hủy đăng ký thành công");
    }

    /** Xem các lớp học mà học viên đang tham gia */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','PARENT')")
    public ApiResponse<List<EnrollmentResponse>> findByStudent(@PathVariable Long studentId) {
        return ApiResponse.success(enrollmentService.findByStudentId(studentId));
    }

    /** Xem danh sách học viên trong lớp */
    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF')")
    public ApiResponse<List<EnrollmentResponse>> findByClass(@PathVariable Long classId) {
        return ApiResponse.success(enrollmentService.findByClassId(classId));
    }

    /** Chuyển lớp */
    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF')")
    public ApiResponse<EnrollmentResponse> transfer(@Valid @RequestBody TransferRequest request) throws Exception {
        return ApiResponse.success(enrollmentService.transfer(request), "Chuyển lớp thành công");
    }
}
