package com.yo.day1.service.impl;

import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.entity.ScheduleSlot;
import com.yo.day1.repository.CourseClassRepository;
import com.yo.day1.service.ScheduleConflictService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
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
    public boolean isDateRangeOverlap(LocalDate start1, LocalDate end1, LocalDate start2, LocalDate end2) {
        if (start1 == null || start2 == null) return true;
        LocalDate effectiveEnd1 = end1 != null ? end1 : LocalDate.MAX;
        LocalDate effectiveEnd2 = end2 != null ? end2 : LocalDate.MAX;
        return !start1.isAfter(effectiveEnd2) && !effectiveEnd1.isBefore(start2);
    }

    @Override
    public String getStudentConflictMessage(Long studentId, ScheduleSlot newSlot, Long excludeClassId) {
        return getStudentConflictMessage(studentId, newSlot, null, null, excludeClassId);
    }

    @Override
    public String getStudentConflictMessage(Long studentId, ScheduleSlot newSlot, LocalDate startDate, LocalDate endDate, Long excludeClassId) {
        List<CourseClass> activeClasses = courseClassRepository.findActiveClassesByStudentId(studentId);

        for (CourseClass cc : activeClasses) {
            if (excludeClassId != null && cc.getId().equals(excludeClassId)) {
                continue;
            }
            if (isDateRangeOverlap(cc.getStartDate(), cc.getEndDate(), startDate, endDate)
                    && isTimeOverlap(cc.getScheduleSlot(), newSlot)) {
                return String.format("Lịch học bị trùng với lớp %s (%s, %s - %s)",
                        cc.getClassCode(),
                        formatWeekday(newSlot.getWeekday()),
                        newSlot.getStartTime(),
                        newSlot.getEndTime());
            }
        }
        return null;
    }

    @Override
    public String getRoomConflictMessage(Long roomId, ScheduleSlot newSlot, Long excludeClassId) {
        return getRoomConflictMessage(roomId, newSlot, null, null, excludeClassId);
    }

    @Override
    public String getRoomConflictMessage(Long roomId, ScheduleSlot newSlot, LocalDate startDate, LocalDate endDate, Long excludeClassId) {
        List<CourseClass> roomClasses = courseClassRepository.findOpenClassesByRoomId(roomId);

        for (CourseClass cc : roomClasses) {
            if (excludeClassId != null && cc.getId().equals(excludeClassId)) {
                continue;
            }
            if (isDateRangeOverlap(cc.getStartDate(), cc.getEndDate(), startDate, endDate)
                    && isTimeOverlap(cc.getScheduleSlot(), newSlot)) {
                return String.format("Phòng %s đã có lớp %s sử dụng vào %s (%s - %s)",
                        cc.getRoom() != null ? cc.getRoom().getName() : "",
                        cc.getClassCode(),
                        formatWeekday(newSlot.getWeekday()),
                        newSlot.getStartTime(),
                        newSlot.getEndTime());
            }
        }
        return null;
    }

    @Override
    public String getTeacherConflictMessage(Long teacherId, ScheduleSlot newSlot, Long excludeClassId) {
        return getTeacherConflictMessage(teacherId, newSlot, null, null, excludeClassId);
    }

    @Override
    public String getTeacherConflictMessage(Long teacherId, ScheduleSlot newSlot, LocalDate startDate, LocalDate endDate, Long excludeClassId) {
        List<CourseClass> teacherClasses = courseClassRepository.findOpenClassesByTeacherId(teacherId);

        for (CourseClass cc : teacherClasses) {
            if (excludeClassId != null && cc.getId().equals(excludeClassId)) {
                continue;
            }
            if (isDateRangeOverlap(cc.getStartDate(), cc.getEndDate(), startDate, endDate)
                    && isTimeOverlap(cc.getScheduleSlot(), newSlot)) {
                String teacherRole = (cc.getMainTeacher() != null && cc.getMainTeacher().getId().equals(teacherId))
                        ? "giáo viên chính" : "trợ giảng";
                return String.format("Giáo viên đã có lịch dạy lớp %s (%s) vào %s (%s - %s)",
                        cc.getClassCode(),
                        teacherRole,
                        formatWeekday(newSlot.getWeekday()),
                        newSlot.getStartTime(),
                        newSlot.getEndTime());
            }
        }
        return null;
    }

    private String formatWeekday(byte weekday) {
        return switch (weekday) {
            case 2 -> "Thứ 2";
            case 3 -> "Thứ 3";
            case 4 -> "Thứ 4";
            case 5 -> "Thứ 5";
            case 6 -> "Thứ 6";
            case 7 -> "Thứ 7";
            case 8 -> "Chủ nhật";
            default -> "Thứ " + weekday;
        };
    }
}
