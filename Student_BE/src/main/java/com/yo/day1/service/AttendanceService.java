package com.yo.day1.service;

import com.yo.day1.dto.attendance.AttendanceBatchRequest;
import com.yo.day1.dto.attendance.AttendanceCreateRequest;
import com.yo.day1.dto.attendance.AttendanceResponse;
import com.yo.day1.dto.attendance.ClassAttendanceDailyDto;
import com.yo.day1.dto.attendance.StudentAttendanceRowDto;
import com.yo.day1.dto.student.StudentResponse;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceService {
    AttendanceResponse create(AttendanceCreateRequest request, String username);
    List<AttendanceResponse> saveBatch(AttendanceBatchRequest request, String username);
    List<AttendanceResponse> findByClassId(Long classId);
    List<AttendanceResponse> findByClassId(Long classId, LocalDate date);
    List<ClassAttendanceDailyDto> getClassesByDate(LocalDate date);
    List<StudentAttendanceRowDto> getAttendanceMatrix(Long classId, int year, int month);
    List<StudentResponse> getEligibleStudents(Long classId);
}
