package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.domain.entity.Parent;
import com.yo.day1.service.ParentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parent")
@RequiredArgsConstructor
public class ParentController {

    private final ParentService parentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Parent>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(parentService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Parent>> getById(@PathVariable Long id) {
        return parentService.findById(id)
                .map(p -> ResponseEntity.ok(ApiResponse.success(p)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Parent>> create(@RequestBody Parent parent) {
        return ResponseEntity.ok(ApiResponse.success(parentService.save(parent)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Parent>> update(@PathVariable Long id, @RequestBody Parent parent) {
        return ResponseEntity.ok(ApiResponse.success(parentService.update(id, parent)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        parentService.delete(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Deleted successfully"));
    }
}
