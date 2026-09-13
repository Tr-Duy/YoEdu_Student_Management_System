package com.yo.day1.service.impl;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.ConflictException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.Room;
import com.yo.day1.dto.room.RoomResponse;
import com.yo.day1.dto.room.RoonUpsertRequest;
import com.yo.day1.repository.CourseClassRepository;
import com.yo.day1.repository.RoomRepository;
import com.yo.day1.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RoomServiceImpl implements RoomService {

    private final RoomRepository roomRepository;
    private final CourseClassRepository courseClassRepository;
    private final ModelMapper mapper;

    @Transactional(readOnly = true)
    @Override
    public List<RoomResponse> findAll() {
        return roomRepository.findAll().stream()
                .map(r -> mapper.map(r, RoomResponse.class))
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<RoomResponse> findById(Long id) {
        return roomRepository.findById(id)
                .map(r -> mapper.map(r, RoomResponse.class));
    }

    @Transactional
    @Override
    public RoomResponse save(RoonUpsertRequest req) {
        if (req.getRoomCode() == null || req.getRoomCode().trim().isEmpty()) {
            throw new BadRequestException("Mã phòng học không được để trống");
        }
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new BadRequestException("Tên phòng học không được để trống");
        }
        if (req.getCapacity() <= 0) {
            throw new BadRequestException("Sức chứa phòng học phải lớn hơn 0");
        }
        if (roomRepository.existsByRoomCode(req.getRoomCode().trim())) {
            throw new ConflictException("Mã phòng học đã tồn tại: " + req.getRoomCode().trim());
        }

        Room room = mapper.map(req, Room.class);
        room.setRoomCode(req.getRoomCode().trim());
        room.setName(req.getName().trim());
        return mapper.map(roomRepository.save(room), RoomResponse.class);
    }

    @Transactional
    @Override
    public RoomResponse update(Long id, RoonUpsertRequest req) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Room not found: " + id));

        if (req.getRoomCode() == null || req.getRoomCode().trim().isEmpty()) {
            throw new BadRequestException("Mã phòng học không được để trống");
        }
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new BadRequestException("Tên phòng học không được để trống");
        }
        if (req.getCapacity() <= 0) {
            throw new BadRequestException("Sức chứa phòng học phải lớn hơn 0");
        }

        if (room.getRoomCode() != null && !room.getRoomCode().equalsIgnoreCase(req.getRoomCode().trim())
                && roomRepository.existsByRoomCode(req.getRoomCode().trim())) {
            throw new ConflictException("Mã phòng học đã tồn tại: " + req.getRoomCode().trim());
        }

        mapper.map(req, room);
        room.setRoomCode(req.getRoomCode().trim());
        room.setName(req.getName().trim());
        return mapper.map(roomRepository.save(room), RoomResponse.class);
    }

    @Transactional
    @Override
    public void delete(Long id) {
        if (!roomRepository.existsById(id)) {
            throw new NotFoundExeception("Room not found: " + id);
        }
        if (courseClassRepository != null && courseClassRepository.existsByRoomId(id)) {
            throw new ConflictException("Không thể xóa phòng học đang được sử dụng bởi lớp học.");
        }
        roomRepository.deleteById(id);
    }
}
