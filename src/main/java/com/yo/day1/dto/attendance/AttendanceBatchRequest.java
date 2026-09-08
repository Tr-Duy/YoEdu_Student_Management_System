package com.yo.day1.dto.attendance;

import com.yo.day1.domain.enums.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class AttendanceBatchRequest {
    @NotNull Long courseClassId;
    @NotNull LocalDate attendanceDate;
    @NotNull List<StudentAttendanceItem> items;

    @Data
    public static class StudentAttendanceItem {
        @NotNull Long studentId;
        @NotNull AttendanceStatus status;
        String note;
    }
}
