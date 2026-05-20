package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.domain.enums.StudentStatus;
import com.yo.day1.dto.student.StudentResponse;
import com.yo.day1.dto.student.StudentUpsertRequest;
import com.yo.day1.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/students")
public class StudentsController {

    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StudentResponse>>> findByAll() {
        return ResponseEntity.ok(ApiResponse.success(studentService.findByAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentResponse>> findById(@PathVariable long id) {
        return studentService.findById(id)
                .map(s -> ResponseEntity.ok(ApiResponse.success(s)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StudentResponse>> create(@RequestBody StudentUpsertRequest req) {
        return ResponseEntity.ok(ApiResponse.success(studentService.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StudentResponse>> update(@PathVariable Long id, @RequestBody StudentUpsertRequest req) {
        return ResponseEntity.ok(ApiResponse.success(studentService.update(id, req)));
    }
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<StudentResponse>> findByStudentCode(@RequestParam String studentCode) {
        return studentService.findByStudentCode(studentCode)
                .map(s -> ResponseEntity.ok(ApiResponse.success(s)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<StudentResponse>>> findByStatus(@PathVariable StudentStatus status) {
        return ResponseEntity.ok(ApiResponse.success(studentService.findByStatus(status)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        studentService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
