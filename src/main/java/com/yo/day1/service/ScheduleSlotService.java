package com.yo.day1.service;

import com.yo.day1.domain.entity.ScheduleSlot;

import java.util.List;
import java.util.Optional;

public interface ScheduleSlotService {
    List<ScheduleSlot> findAll();

    Optional<ScheduleSlot> findById(Long id);

    ScheduleSlot save(ScheduleSlot scheduleSlot);

    void deleteById(Long id);
}
