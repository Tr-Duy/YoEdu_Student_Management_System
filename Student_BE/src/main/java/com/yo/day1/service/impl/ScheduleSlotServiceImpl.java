package com.yo.day1.service.impl;

import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.ScheduleSlot;
import com.yo.day1.repository.ScheduleSlotRepository;
import com.yo.day1.service.ScheduleSlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ScheduleSlotServiceImpl implements ScheduleSlotService {

    private final ScheduleSlotRepository scheduleSlotRepository;

    @Override
    public List<ScheduleSlot> findAll() {
        return scheduleSlotRepository.findAll();
    }

    @Override
    public Optional<ScheduleSlot> findById(Long id) {
        return scheduleSlotRepository.findById(id);
    }

    @Override
    public ScheduleSlot save(ScheduleSlot scheduleSlot) {
        return scheduleSlotRepository.save(scheduleSlot);
    }

    @Override
    public void deleteById(Long id) {
        if (!scheduleSlotRepository.existsById(id)) {
            throw new NotFoundExeception("ScheduleSlot not found: " + id);
        }
        scheduleSlotRepository.deleteById(id);
    }
}
