package com.yo.day1.dto.courseclass;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record CourseClassResponse(
        Long id,
        String classCode,
        String name,
        Long courseId,
        String courseName,
        Long roomId,
        String roomName,
        Long scheduleSlotId,
        String scheduleLabel,
        Long mainTeacherId,
        String mainTeacherName,
        Long assistantTeacherId,
        String assistantTeacherName,
        LocalDate startDate,
        LocalDate endDate,
        Integer maxStudents,
        BigDecimal tuitionFee,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
