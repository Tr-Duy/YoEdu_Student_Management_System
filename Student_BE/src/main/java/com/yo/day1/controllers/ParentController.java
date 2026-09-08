package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.dto.parent.ParentResponse;
import com.yo.day1.dto.parent.ParentUpsertRequest;
import com.yo.day1.service.ParentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/parents")
@RequiredArgsConstructor
public class ParentController {

    private final ParentService parentService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ParentResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(parentService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ParentResponse>> getById(@PathVariable Long id) {
        Optional<ParentResponse> result = parentService.findById(id);
        if (result.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(result.get()));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ParentResponse>> create(@Valid @RequestBody ParentUpsertRequest req) {
        return ResponseEntity.ok(ApiResponse.success(parentService.save(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ParentResponse>> update(@PathVariable Long id, @Valid @RequestBody ParentUpsertRequest req) {
        return ResponseEntity.ok(ApiResponse.success(parentService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        parentService.delete(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Deleted successfully"));
    }
}
