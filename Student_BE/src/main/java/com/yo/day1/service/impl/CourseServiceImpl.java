package com.yo.day1.service.impl;

import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.Course;
import com.yo.day1.domain.spec.CourseSpec;
import com.yo.day1.dto.course.CourseResponse;
import com.yo.day1.dto.course.CourseUpsertRequest;
import com.yo.day1.repository.CourseRepository;
import com.yo.day1.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final ModelMapper mapper;

    @Override
    public List<CourseResponse> findAll() {
        return findAll(null);
    }

    @Override
    public List<CourseResponse> findAll(String search) {
        return courseRepository.findAll(CourseSpec.filter(search))
                .stream()
                .map(c -> mapper.map(c, CourseResponse.class))
                .toList();
    }

    @Override
    public Optional<CourseResponse> findById(Long id) {
        return courseRepository.findById(id)
                .map(c -> mapper.map(c, CourseResponse.class));
    }

    @Override
    public CourseResponse save(CourseUpsertRequest req) {
        if (courseRepository.existsByCourseCode(req.getCourseCode())) {
            throw new com.yo.day1.common.exception.ConflictException("Mã khóa học đã tồn tại: " + req.getCourseCode());
        }
        Course course = mapper.map(req, Course.class);
        return mapper.map(courseRepository.save(course), CourseResponse.class);
    }

    @Override
    public CourseResponse update(Long id, CourseUpsertRequest req) {
        Course existing = courseRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Course not found: " + id));
        if (existing.getCourseCode() != null && !existing.getCourseCode().equalsIgnoreCase(req.getCourseCode())
                && courseRepository.existsByCourseCode(req.getCourseCode())) {
            throw new com.yo.day1.common.exception.ConflictException("Mã khóa học đã tồn tại: " + req.getCourseCode());
        }
        mapper.map(req, existing);
        return mapper.map(courseRepository.save(existing), CourseResponse.class);
    }

    @Override
    public void delete(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new NotFoundExeception("Course not found: " + id);
        }
        courseRepository.deleteById(id);
    }
}
