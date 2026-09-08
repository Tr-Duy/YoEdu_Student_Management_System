package com.yo.day1.dto.attendance;

public record ClassAttendanceDailyDto(
        Long classId,
        String classCode,
        String className,
        Long courseId,
        String courseName,
        String scheduleLabel,
        String roomName,
        Long teacherId,
        String teacherName,
        int totalStudents,
        int attendedCount,
        int presentCount,
        int absentCount,
        int lateCount,
        int excusedCount,
        boolean isAttended
) {}
