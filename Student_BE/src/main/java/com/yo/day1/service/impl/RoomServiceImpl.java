package com.yo.day1.service.impl;

import com.yo.day1.domain.entity.Room;
import com.yo.day1.dto.room.RoomResponse;
import com.yo.day1.dto.room.RoonUpsertRequest;
import com.yo.day1.repository.RoomRepository;
import com.yo.day1.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final ModelMapper mapper;

    @Override
    public List<RoomResponse> findAll() {
        return roomRepository.findAll().stream()
                .map(r -> mapper.map(r, RoomResponse.class))
                .toList();
    }

    @Override
    public Optional<RoomResponse> findById(Long id) {
        return roomRepository.findById(id)
                .map(r -> mapper.map(r, RoomResponse.class));
    }

    @Override
    public RoomResponse save(RoonUpsertRequest req) {
        Room room = mapper.map(req, Room.class);
        return mapper.map(roomRepository.save(room), RoomResponse.class);
    }

    @Override
    public RoomResponse update(Long id, RoonUpsertRequest req) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found: " + id));
        mapper.map(req, room);
        return mapper.map(roomRepository.save(room), RoomResponse.class);
    }

    @Override
    public void delete(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new RuntimeException("Room not found: " + id);
        }
        roomRepository.deleteById(id);
    }
}
