package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.domain.enums.ClassStatus;
import com.yo.day1.dto.courseclass.CourseClassCreateRequest;
import com.yo.day1.dto.courseclass.CourseClassResponse;
import com.yo.day1.service.CourseClassService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course-classes")
@RequiredArgsConstructor
@Tag(name = "Course Classes")
@SecurityRequirement(name = "bearerAuth")
public class CourseClassController {

    private final CourseClassService courseClassService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    @Operation(summary = "Search course classes with pagination, filter and sort")
    public ApiResponse<Page<CourseClassResponse>> search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ClassStatus status,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long teacherId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(courseClassService.search(search, status, courseId, teacherId, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ApiResponse<CourseClassResponse> findById(@PathVariable Long id) {
        return ApiResponse.success(courseClassService.findById(id));
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ApiResponse<List<CourseClassResponse>> getByCourseId(@PathVariable Long courseId) {
        return ApiResponse.success(courseClassService.findByCourseId(courseId));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF', 'PARENT')")
    public ApiResponse<List<CourseClassResponse>> getByStudentId(@PathVariable Long studentId) {
        return ApiResponse.success(courseClassService.findByStudentId(studentId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ApiResponse<CourseClassResponse> create(@Valid @RequestBody CourseClassCreateRequest request) {
        return ApiResponse.success(courseClassService.create(request), "Class created");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ApiResponse<CourseClassResponse> update(@PathVariable Long id, @Valid @RequestBody CourseClassCreateRequest request) {
        return ApiResponse.success(courseClassService.update(id, request), "Class updated");
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        courseClassService.delete(id);
        return ApiResponse.successMessage("Class deleted");
    }
}