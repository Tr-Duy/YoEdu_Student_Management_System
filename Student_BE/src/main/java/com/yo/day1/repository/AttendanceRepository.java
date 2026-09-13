package com.yo.day1.repository;

import com.yo.day1.domain.entity.Attendence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendence, Long> {
    List<Attendence> findByCourseClassId(Long classId);
    List<Attendence> findByCourseClassIdAndAttendanceDate(Long classId, LocalDate attendanceDate);
    List<Attendence> findByAttendanceDate(LocalDate attendanceDate);
    @Query("""
            SELECT a FROM Attendence a
            WHERE a.courseClass.id = :classId
              AND YEAR(a.attendanceDate) = :year
              AND MONTH(a.attendanceDate) = :month
            """)
    List<Attendence> findByCourseClassIdAndAttendanceDateYearAndAttendanceDateMonthValue(
            @Param("classId") Long classId,
            @Param("year") int year,
            @Param("month") int month);
    boolean existsByCourseClassIdAndStudentIdAndAttendanceDate(Long courseClassId, Long studentId, LocalDate attendanceDate);
    boolean existsByStudentId(Long studentId);
    java.util.Optional<Attendence> findByCourseClassIdAndStudentIdAndAttendanceDate(Long courseClassId, Long studentId, LocalDate attendanceDate);

    @Query("""
            SELECT e.student FROM Enrollment e
            WHERE e.courseClass.id = :classId
              AND e.status = 'ACTIVE'
              AND e.student.status = 'ACTIVE'
            """)
    List<com.yo.day1.domain.entity.Student> findEligibleStudentsForAttendance(@Param("classId") Long classId);

    // Báo cáo điểm danh theo lớp/tháng
    @Query("""
            SELECT a.courseClass.id, a.courseClass.name,
                   SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END),
                   SUM(CASE WHEN a.status = 'ABSENT'  THEN 1 ELSE 0 END),
                   SUM(CASE WHEN a.status = 'LATE'    THEN 1 ELSE 0 END),
                   COUNT(a)
            FROM Attendence a
            WHERE YEAR(a.attendanceDate) = :year AND MONTH(a.attendanceDate) = :month
              AND (:classId IS NULL OR a.courseClass.id = :classId)
            GROUP BY a.courseClass.id, a.courseClass.name
            """)
    List<Object[]> attendanceSummary(@Param("year") int year,
                                     @Param("month") int month,
                                     @Param("classId") Long classId);

    // Top học viên vắng nhiều nhất
    @Query("""
            SELECT a.student.id, a.student.fullName, a.student.studentCode, COUNT(a)
            FROM Attendence a
            WHERE a.status = 'ABSENT'
              AND (:year IS NULL OR YEAR(a.attendanceDate) = :year)
              AND (:month IS NULL OR MONTH(a.attendanceDate) = :month)
            GROUP BY a.student.id, a.student.fullName, a.student.studentCode
            ORDER BY COUNT(a) DESC
            """)
    List<Object[]> topAbsentStudents(@Param("year") Integer year,
                                     @Param("month") Integer month);

    @Query("""
            SELECT SUM(CASE WHEN a.status = 'PRESENT' OR a.status = 'LATE' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(a), 0)
            FROM Attendence a
            WHERE a.student.id = :studentId
              AND a.courseClass.id = :classId
              AND YEAR(a.attendanceDate) = :year
              AND MONTH(a.attendanceDate) = :month
            """)
    Double calculateAttendanceRate(@Param("studentId") Long studentId,
                                   @Param("classId") Long classId,
                                   @Param("year") int year,
                                   @Param("month") int month);

    @Query("""
            SELECT SUM(CASE WHEN a.status = 'PRESENT' OR a.status = 'LATE' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(a), 0)
            FROM Attendence a
            WHERE a.student.id = :studentId
              AND a.courseClass.id = :classId
            """)
    Double calculateOverallAttendanceRate(@Param("studentId") Long studentId,
                                          @Param("classId") Long classId);
}
