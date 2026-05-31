package com.yo.day1.repository;

import com.yo.day1.domain.entity.Enrollment;
import com.yo.day1.domain.enums.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findByStudentId(Long studentId);

    List<Enrollment> findByCourseClassId(Long courseClassId);

    Optional<Enrollment> findByStudentIdAndCourseClassId(Long studentId, Long courseClassId);

    boolean existsByStudentIdAndCourseClassIdAndStatus(Long studentId, Long courseClassId, EnrollmentStatus status);

    long countByCourseClassIdAndStatus(Long courseClassId, EnrollmentStatus status);

    @Query("""
            SELECT COUNT(e) > 0 FROM Enrollment e
            WHERE e.student.id = :studentId
              AND e.status = 'ACTIVE'
              AND e.courseClass.scheduleSlot.id = :scheduleSlotId
              AND e.courseClass.id <> :excludeClassId
            """)
    boolean hasScheduleConflict(@Param("studentId") Long studentId,
                                @Param("scheduleSlotId") Long scheduleSlotId,
                                @Param("excludeClassId") Long excludeClassId);

    // Báo cáo sĩ số từng lớp
    @Query("""
            SELECT e.courseClass.id, e.courseClass.classCode, e.courseClass.name,
                   e.courseClass.status, e.courseClass.maxStudents, COUNT(e)
            FROM Enrollment e
            WHERE e.status = 'ACTIVE'
            GROUP BY e.courseClass.id, e.courseClass.classCode, e.courseClass.name,
                     e.courseClass.status, e.courseClass.maxStudents
            ORDER BY e.courseClass.name
            """)
    List<Object[]> classEnrollmentSummary();
}
