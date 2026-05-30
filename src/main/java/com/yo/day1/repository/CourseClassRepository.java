package com.yo.day1.repository;

import com.yo.day1.domain.entity.CourseClass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseClassRepository extends JpaRepository<CourseClass, Long> {
    Page<CourseClass> findByNameContainingIgnoreCaseOrClassCodeContainingIgnoreCase(String name, String classCode, Pageable pageable);
    List<CourseClass> findByCourseId(Long courseId);
}
