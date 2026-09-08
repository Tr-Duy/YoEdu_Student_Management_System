package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.ScheduleSlot;
import com.yo.day1.dto.scheduleslot.ScheduleSlotResponse;
import com.yo.day1.dto.scheduleslot.ScheduleSlotUpsertRequest;
import com.yo.day1.service.ScheduleSlotService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/schedule-slots")
public class ScheduleSlotController {

    private final ScheduleSlotService scheduleSlotService;
    private final ModelMapper mapper;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<List<ScheduleSlotResponse>>> findAll() {
        List<ScheduleSlotResponse> list = scheduleSlotService.findAll().stream()
                .map(s -> mapper.map(s, ScheduleSlotResponse.class))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACADEMIC_STAFF')")
    public ResponseEntity<ApiResponse<ScheduleSlotResponse>> findById(@PathVariable Long id) {
        ScheduleSlotResponse res = scheduleSlotService.findById(id)
                .map(s -> mapper.map(s, ScheduleSlotResponse.class))
                .orElseThrow(() -> new NotFoundExeception("Schedule slot not found: " + id));
        return ResponseEntity.ok(ApiResponse.success(res));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ScheduleSlotResponse>> save(@Valid @RequestBody ScheduleSlotUpsertRequest req) {
        ScheduleSlot entity = mapper.map(req, ScheduleSlot.class);
        ScheduleSlot saved = scheduleSlotService.save(entity);
        return ResponseEntity.ok(ApiResponse.success(mapper.map(saved, ScheduleSlotResponse.class)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ScheduleSlotResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody ScheduleSlotUpsertRequest req) {
        ScheduleSlot entity = scheduleSlotService.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Schedule slot not found: " + id));
        mapper.map(req, entity);
        ScheduleSlot saved = scheduleSlotService.save(entity);
        return ResponseEntity.ok(ApiResponse.success(mapper.map(saved, ScheduleSlotResponse.class)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        scheduleSlotService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Deleted successfully"));
    }
}
