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

    @Query("""
            SELECT cc FROM CourseClass cc
            JOIN Enrollment e ON e.courseClass.id = cc.id
            WHERE e.student.id = :studentId AND e.status = 'ACTIVE'
            """)
    List<CourseClass> findActiveClassesByStudentId(@Param("studentId") Long studentId);
}
