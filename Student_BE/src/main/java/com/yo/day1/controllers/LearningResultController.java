package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.dto.learning.LearningResultCreateRequest;
import com.yo.day1.dto.learning.LearningResultResponse;
import com.yo.day1.dto.learning.LearningResultUpdateRequest;
import com.yo.day1.dto.learning.LearningResultSearchRequest;
import com.yo.day1.service.LearningResultService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/learning-results")
@RequiredArgsConstructor
public class LearningResultController {

    private final LearningResultService learningResultService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF')")
    public ApiResponse<LearningResultResponse> create(@Valid @RequestBody LearningResultCreateRequest request, Principal principal) {
        return ApiResponse.success(learningResultService.create(request, principal.getName()), "Learning result created");
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF')")
    public ApiResponse<LearningResultResponse> update(@PathVariable Long id,
                                                      @Valid @RequestBody LearningResultUpdateRequest request,
                                                      Principal principal) {
        return ApiResponse.success(learningResultService.update(id, request, principal.getName()), "Updated");
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF','PARENT')")
    public ApiResponse<List<LearningResultResponse>> findByStudentId(@PathVariable Long studentId, Principal principal) {
        return ApiResponse.success(learningResultService.findByStudentId(studentId, principal.getName()));
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF')")
    public ApiResponse<List<LearningResultResponse>> findByClassId(@PathVariable Long classId) {
        return ApiResponse.success(learningResultService.findByClassId(classId));
    }

    @PostMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF')")
    public ApiResponse<List<LearningResultResponse>> search(@RequestBody LearningResultSearchRequest request, Principal principal) {
        return ApiResponse.success(learningResultService.search(request, principal.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF')")
    public ApiResponse<Void> delete(@PathVariable Long id, Principal principal) {
        learningResultService.delete(id, principal.getName());
        return ApiResponse.success(null, "Deleted");
    }

    @PatchMapping("/{id}/lock")
    @PreAuthorize("hasAnyRole('ADMIN','ACADEMIC_STAFF')")
    public ApiResponse<Void> lock(@PathVariable Long id, Principal principal) {
        learningResultService.lock(id, principal.getName());
        return ApiResponse.success(null, "Locked");
    }

    @PatchMapping("/{id}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> unlock(@PathVariable Long id, Principal principal) {
        learningResultService.unlock(id, principal.getName());
        return ApiResponse.success(null, "Unlocked");
    }
}
