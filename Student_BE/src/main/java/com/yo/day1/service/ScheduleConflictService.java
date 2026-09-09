package com.yo.day1.service;

import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.entity.ScheduleSlot;

public interface ScheduleConflictService {

    boolean hasStudentScheduleConflict(Long studentId, ScheduleSlot newSlot, Long excludeClassId);

    boolean hasRoomScheduleConflict(Long roomId, ScheduleSlot newSlot, Long excludeClassId);

    boolean hasTeacherScheduleConflict(Long teacherId, ScheduleSlot newSlot, Long excludeClassId);

    boolean isTimeOverlap(ScheduleSlot slot1, ScheduleSlot slot2);

    String getStudentConflictMessage(Long studentId, ScheduleSlot newSlot, Long excludeClassId);

    String getRoomConflictMessage(Long roomId, ScheduleSlot newSlot, Long excludeClassId);

    String getTeacherConflictMessage(Long teacherId, ScheduleSlot newSlot, Long excludeClassId);
}
