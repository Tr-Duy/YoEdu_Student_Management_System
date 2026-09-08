package com.yo.day1.dto.attendance;

import lombok.Data;

import java.util.Map;

@Data
public class StudentAttendanceRowDto {
    Long studentId;
    String studentName;
    Map<String, String> attendanceByDate;
}
