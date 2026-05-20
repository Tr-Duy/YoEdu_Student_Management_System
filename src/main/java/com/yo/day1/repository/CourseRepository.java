package com.yo.day1.repository;

import com.yo.day1.domain.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    @Query("SELECT o FROM Course o where o.isActive=1")
    List<Course> findByIdCourseActive();
}
