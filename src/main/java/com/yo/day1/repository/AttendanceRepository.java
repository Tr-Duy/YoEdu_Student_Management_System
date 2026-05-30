package com.yo.day1.repository;

import com.yo.day1.domain.entity.Attendence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendence, Long> {
    List<Attendence> findByCourseClassId(Long classId);
    List<Attendence> findByCourseClassIdAndAttendanceDateYearAndAttendanceDateMonthValue(Long classId, int year, int month);
    boolean existsByCourseClassIdAndStudentIdAndAttendanceDate(Long courseClassId, Long studentId, LocalDate attendanceDate);
}
