package com.yo.day1.repository;

import com.yo.day1.domain.entity.CourseClass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseClassRepository extends JpaRepository<CourseClass, Long>, JpaSpecificationExecutor<CourseClass> {
    Page<CourseClass> findByNameContainingIgnoreCaseOrClassCodeContainingIgnoreCase(String name, String classCode, Pageable pageable);
    List<CourseClass> findByCourseId(Long courseId);

    boolean existsByClassCode(String classCode);

    @Query("""
            SELECT cc FROM CourseClass cc
            JOIN Enrollment e ON e.courseClass.id = cc.id
            WHERE e.student.id = :studentId AND e.status = 'ACTIVE'
              AND cc.status IN ('OPEN', 'ONGOING', 'FULL')
            """)
    List<CourseClass> findActiveClassesByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT cc FROM CourseClass cc WHERE cc.room.id = :roomId AND cc.status IN ('OPEN', 'ONGOING', 'FULL')")
    List<CourseClass> findOpenClassesByRoomId(@Param("roomId") Long roomId);

    @Query("SELECT cc FROM CourseClass cc WHERE (cc.mainTeacher.id = :teacherId OR cc.assistantTeacher.id = :teacherId) AND cc.status IN ('OPEN', 'ONGOING', 'FULL')")
    List<CourseClass> findOpenClassesByTeacherId(@Param("teacherId") Long teacherId);

    @Query("""
            SELECT COUNT(cc) > 0 FROM CourseClass cc
            WHERE (cc.mainTeacher.id = :teacherId OR cc.assistantTeacher.id = :teacherId)
              AND cc.status IN ('OPEN', 'ONGOING', 'FULL')
            """)
    boolean hasActiveClassesForTeacher(@Param("teacherId") Long teacherId);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT cc FROM CourseClass cc WHERE cc.id = :id")
    java.util.Optional<CourseClass> findByIdWithLock(@Param("id") Long id);
}
