package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.domain.enums.StudentStatus;
import com.yo.day1.dto.student.ChangeStudentStatusRequest;
import com.yo.day1.dto.student.StudentResponse;
import com.yo.day1.dto.student.StudentStatusHistoryResponse;
import com.yo.day1.dto.student.StudentUpsertRequest;
import com.yo.day1.service.AuthService;
import com.yo.day1.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/students")
@Tag(name = "Students")
@SecurityRequirement(name = "bearerAuth")
public class StudentsController {

    private final StudentService studentService;
    private final AuthService authService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    @Operation(summary = "Search students with pagination, filter and sort")
    public ApiResponse<Page<StudentResponse>> search(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) StudentStatus status,
            @RequestParam(required = false) String gradeLevel,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(studentService.search(search, status, gradeLevel, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF', 'PARENT')")
    public ResponseEntity<ApiResponse<StudentResponse>> findById(@PathVariable long id) {
        return studentService.findById(id)
                .map(s -> ResponseEntity.ok(ApiResponse.success(s)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<StudentResponse>> create(@Valid @RequestBody StudentUpsertRequest req) {
        return ResponseEntity.ok(ApiResponse.success(studentService.create(req)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<StudentResponse>> update(@PathVariable Long id, @Valid @RequestBody StudentUpsertRequest req) {
        return ResponseEntity.ok(ApiResponse.success(studentService.update(id, req)));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF', 'PARENT')")
    public ResponseEntity<ApiResponse<StudentResponse>> findByStudentCode(@RequestParam String studentCode) {
        return studentService.findByStudentCode(studentCode)
                .map(s -> ResponseEntity.ok(ApiResponse.success(s)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/search/name")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<List<StudentResponse>>> searchByName(@RequestParam String name) {
        return ResponseEntity.ok(ApiResponse.success(studentService.searchByName(name)));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<List<StudentResponse>>> findByStatus(@PathVariable StudentStatus status) {
        return ResponseEntity.ok(ApiResponse.success(studentService.findByStatus(status)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        studentService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Deleted successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<StudentResponse>> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody ChangeStudentStatusRequest request,
            Principal principal) {
        Long userId = authService.findActiveUserByUsername(principal.getName()).getId();
        return ResponseEntity.ok(ApiResponse.success(studentService.changeStatus(id, request, userId)));
    }

    @GetMapping("/{id}/status-history")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<List<StudentStatusHistoryResponse>>> getStatusHistory(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(studentService.getStatusHistory(id)));
    }
}