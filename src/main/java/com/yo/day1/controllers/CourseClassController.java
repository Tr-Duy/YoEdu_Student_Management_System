package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.dto.courseclass.CourseClassCreateRequest;
import com.yo.day1.dto.courseclass.CourseClassResponse;
import com.yo.day1.service.CourseClassService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course-classes")
@RequiredArgsConstructor
public class CourseClassController {

    private final CourseClassService courseClassService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ApiResponse<Page<CourseClassResponse>> findAll(
            @RequestParam(required = false) String search, Pageable pageable) {
        return ApiResponse.success(courseClassService.findAll(search, pageable));
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
