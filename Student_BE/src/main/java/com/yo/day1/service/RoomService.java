package com.yo.day1.service;

import com.yo.day1.dto.room.RoomResponse;
import com.yo.day1.dto.room.RoonUpsertRequest;

import java.util.List;
import java.util.Optional;

public interface RoomService {
    List<RoomResponse> findAll();
    Optional<RoomResponse> findById(Long id);
    RoomResponse save(RoonUpsertRequest req);
    RoomResponse update(Long id, RoonUpsertRequest req);
    void delete(Long id);
}
