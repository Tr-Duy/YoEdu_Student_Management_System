package com.yo.day1.service.impl;

import com.yo.day1.domain.entity.Course;
import com.yo.day1.repository.CourseRepository;
import com.yo.day1.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {
    private final CourseRepository courseRepository;

    public List<Course> findAll() {
        return courseRepository.findAll();
    }
    public Optional<Course> findById(Long id) {
        return courseRepository.findById(id);
    }
    public Course save(Course course) {
        return courseRepository.save(course);
    }

    public Course update(Long id, Course course) {
        Course existing = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found: " + id));
        existing.setCourseCode(course.getCourseCode());
        existing.setCourseName(course.getCourseName());
        existing.setCourseDescription(course.getCourseDescription());
        existing.setTuitionFee(course.getTuitionFee());
        existing.setTotalSession(course.getTotalSession());
        existing.setIsActive(course.getIsActive());
        return courseRepository.save(existing);
    }

    public void delete(Long id) {
        courseRepository.deleteById(id);
    }
}
