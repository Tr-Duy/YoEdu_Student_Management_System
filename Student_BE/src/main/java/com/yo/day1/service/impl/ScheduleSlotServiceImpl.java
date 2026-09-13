package com.yo.day1.service.impl;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.ConflictException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.ScheduleSlot;
import com.yo.day1.repository.CourseClassRepository;
import com.yo.day1.repository.ScheduleSlotRepository;
import com.yo.day1.service.ScheduleSlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ScheduleSlotServiceImpl implements ScheduleSlotService {

    private final ScheduleSlotRepository scheduleSlotRepository;
    private final CourseClassRepository courseClassRepository;

    @Transactional(readOnly = true)
    @Override
    public List<ScheduleSlot> findAll() {
        return scheduleSlotRepository.findAll();
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<ScheduleSlot> findById(Long id) {
        return scheduleSlotRepository.findById(id);
    }

    @Transactional
    @Override
    public ScheduleSlot save(ScheduleSlot scheduleSlot) {
        if (scheduleSlot.getSlotCode() == null || scheduleSlot.getSlotCode().trim().isEmpty()) {
            throw new BadRequestException("Mã ca học không được để trống");
        }
        if (scheduleSlot.getWeekday() < 2 || scheduleSlot.getWeekday() > 8) {
            throw new BadRequestException("Thứ trong tuần phải từ 2 (Thứ Hai) đến 8 (Chủ Nhật)");
        }
        if (scheduleSlot.getStartTime() == null || scheduleSlot.getEndTime() == null) {
            throw new BadRequestException("Giờ bắt đầu và kết thúc ca học không được để trống");
        }
        if (!scheduleSlot.getStartTime().isBefore(scheduleSlot.getEndTime())) {
            throw new BadRequestException("Giờ bắt đầu phải trước giờ kết thúc");
        }

        String code = scheduleSlot.getSlotCode().trim();
        if (scheduleSlot.getId() == null) {
            if (scheduleSlotRepository.existsBySlotCode(code)) {
                throw new ConflictException("Mã ca học đã tồn tại: " + code);
            }
        } else {
            Optional<ScheduleSlot> existingOpt = scheduleSlotRepository.findById(scheduleSlot.getId());
            if (existingOpt.isPresent() && !existingOpt.get().getSlotCode().equalsIgnoreCase(code)) {
                if (scheduleSlotRepository.existsBySlotCode(code)) {
                    throw new ConflictException("Mã ca học đã tồn tại: " + code);
                }
            }
        }
        scheduleSlot.setSlotCode(code);
        return scheduleSlotRepository.save(scheduleSlot);
    }

    @Transactional
    @Override
    public void deleteById(Long id) {
        if (!scheduleSlotRepository.existsById(id)) {
            throw new NotFoundExeception("ScheduleSlot not found: " + id);
        }
        if (courseClassRepository != null && courseClassRepository.existsByScheduleSlotId(id)) {
            throw new ConflictException("Không thể xóa ca học đang được áp dụng cho lớp học.");
        }
        scheduleSlotRepository.deleteById(id);
    }
}
