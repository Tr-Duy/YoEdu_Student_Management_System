package com.yo.day1.service.impl;

import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.entity.ScheduleSlot;
import com.yo.day1.repository.CourseClassRepository;
import com.yo.day1.service.ScheduleConflictService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleConflictServiceImpl implements ScheduleConflictService {

    private final CourseClassRepository courseClassRepository;

    @Override
    public boolean hasStudentScheduleConflict(Long studentId, ScheduleSlot newSlot, Long excludeClassId) {
        return getStudentConflictMessage(studentId, newSlot, excludeClassId) != null;
    }

    @Override
    public boolean hasRoomScheduleConflict(Long roomId, ScheduleSlot newSlot, Long excludeClassId) {
        return getRoomConflictMessage(roomId, newSlot, excludeClassId) != null;
    }

    @Override
    public boolean hasTeacherScheduleConflict(Long teacherId, ScheduleSlot newSlot, Long excludeClassId) {
        return getTeacherConflictMessage(teacherId, newSlot, excludeClassId) != null;
    }

    @Override
    public boolean isTimeOverlap(ScheduleSlot slot1, ScheduleSlot slot2) {
        if (slot1 == null || slot2 == null) return false;
        if (slot1.getWeekday() != slot2.getWeekday()) return false;
        
        LocalTime start1 = slot1.getStartTime();
        LocalTime end1 = slot1.getEndTime();
        LocalTime start2 = slot2.getStartTime();
        LocalTime end2 = slot2.getEndTime();
        
        if (start1 == null || end1 == null || start2 == null || end2 == null) return false;
        
        // Overlap condition: start1 < end2 AND end1 > start2
        return start1.isBefore(end2) && end1.isAfter(start2);
    }

    @Override
    public String getStudentConflictMessage(Long studentId, ScheduleSlot newSlot, Long excludeClassId) {
        List<CourseClass> activeClasses = courseClassRepository.findActiveClassesByStudentId(studentId);
        
        for (CourseClass cc : activeClasses) {
            if (excludeClassId != null && cc.getId().equals(excludeClassId)) {
                continue;
            }
            if (isTimeOverlap(cc.getScheduleSlot(), newSlot)) {
                return String.format("Lịch học bị trùng với lớp %s", cc.getClassCode());
            }
        }
        return null;
    }

    @Override
    public String getRoomConflictMessage(Long roomId, ScheduleSlot newSlot, Long excludeClassId) {
        List<CourseClass> roomClasses = courseClassRepository.findOpenClassesByRoomId(roomId);
        
        for (CourseClass cc : roomClasses) {
            if (excludeClassId != null && cc.getId().equals(excludeClassId)) {
                continue;
            }
            if (isTimeOverlap(cc.getScheduleSlot(), newSlot)) {
                return String.format("Phòng đã có lớp (%s) sử dụng vào khung giờ này", cc.getClassCode());
            }
        }
        return null;
    }

    @Override
    public String getTeacherConflictMessage(Long teacherId, ScheduleSlot newSlot, Long excludeClassId) {
        List<CourseClass> teacherClasses = courseClassRepository.findOpenClassesByTeacherId(teacherId);
        
        for (CourseClass cc : teacherClasses) {
            if (excludeClassId != null && cc.getId().equals(excludeClassId)) {
                continue;
            }
            if (isTimeOverlap(cc.getScheduleSlot(), newSlot)) {
                return String.format("Giáo viên đã có lịch dạy lớp %s vào khung giờ này", cc.getClassCode());
            }
        }
        return null;
    }
}
