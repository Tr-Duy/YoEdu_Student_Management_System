package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.domain.entity.Teacher;
import com.yo.day1.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherController {

    private final TeacherService teacherService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Teacher>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(teacherService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Teacher>> getById(@PathVariable Long id) {
        return teacherService.findById(id)
                .map(t -> ResponseEntity.ok(ApiResponse.success(t)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Teacher>> create(@RequestBody Teacher teacher) {
        return ResponseEntity.ok(ApiResponse.success(teacherService.save(teacher)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Teacher>> update(@PathVariable Long id, @RequestBody Teacher teacher) {
        return ResponseEntity.ok(ApiResponse.success(teacherService.update(id, teacher)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        teacherService.delete(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Deleted successfully"));
    }
}
