package com.yo.day1.dto.attendance;

import com.yo.day1.domain.enums.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AttendanceCreateRequest {
    @NotNull Long courseClassId;
    @NotNull Long studentId;
    @NotNull LocalDate attendanceDate;
    @NotNull AttendanceStatus status;
    @Size(max = 255) String note;
}
