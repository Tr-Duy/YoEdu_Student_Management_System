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
}
