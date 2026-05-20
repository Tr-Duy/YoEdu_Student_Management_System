package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.dto.room.RoomResponse;
import com.yo.day1.dto.room.RoonUpsertRequest;
import com.yo.day1.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoomResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(roomService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> findById(@PathVariable Long id) {
        Optional<RoomResponse> result = roomService.findById(id);
        if (result.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(result.get()));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoomResponse>> save(@RequestBody RoonUpsertRequest req) {
        return ResponseEntity.ok(ApiResponse.success(roomService.save(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoomResponse>> update(@PathVariable Long id, @RequestBody RoonUpsertRequest req) {
        return ResponseEntity.ok(ApiResponse.success(roomService.update(id, req)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        roomService.delete(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Deleted successfully"));
    }
}
