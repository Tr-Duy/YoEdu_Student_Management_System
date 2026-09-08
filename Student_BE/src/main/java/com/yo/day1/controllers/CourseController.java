package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.dto.course.CourseResponse;
import com.yo.day1.dto.course.CourseUpsertRequest;
import com.yo.day1.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/course")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getAll(
            @RequestParam(required = false) String search) {
        log.info("COURSE SEARCH PARAM = [{}]", search);
        return ResponseEntity.ok(ApiResponse.success(courseService.findAll(search)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<CourseResponse>> getById(@PathVariable Long id) {
        Optional<CourseResponse> result = courseService.findById(id);
        if (result.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(result.get()));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseResponse>> create(@Valid @RequestBody CourseUpsertRequest req) {
        return ResponseEntity.ok(ApiResponse.success(courseService.save(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseResponse>> update(@PathVariable Long id, @Valid @RequestBody CourseUpsertRequest req) {
        return ResponseEntity.ok(ApiResponse.success(courseService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        courseService.delete(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Deleted successfully"));
    }
}
