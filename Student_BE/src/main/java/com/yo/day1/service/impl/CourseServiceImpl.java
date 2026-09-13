package com.yo.day1.service.impl;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.ConflictException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.Course;
import com.yo.day1.domain.spec.CourseSpec;
import com.yo.day1.dto.course.CourseResponse;
import com.yo.day1.dto.course.CourseUpsertRequest;
import com.yo.day1.repository.CourseClassRepository;
import com.yo.day1.repository.CourseRepository;
import com.yo.day1.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final CourseClassRepository courseClassRepository;
    private final ModelMapper mapper;

    @Transactional(readOnly = true)
    @Override
    public List<CourseResponse> findAll() {
        return findAll(null);
    }

    @Transactional(readOnly = true)
    @Override
    public List<CourseResponse> findAll(String search) {
        return courseRepository.findAll(CourseSpec.filter(search))
                .stream()
                .map(c -> mapper.map(c, CourseResponse.class))
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<CourseResponse> findById(Long id) {
        return courseRepository.findById(id)
                .map(c -> mapper.map(c, CourseResponse.class));
    }

    @Transactional
    @Override
    public CourseResponse save(CourseUpsertRequest req) {
        if (req.getCourseCode() == null || req.getCourseCode().trim().isEmpty()) {
            throw new BadRequestException("Mã khóa học không được để trống");
        }
        if (req.getCourseName() == null || req.getCourseName().trim().isEmpty()) {
            throw new BadRequestException("Tên khóa học không được để trống");
        }
        if (req.getTotalSession() <= 0) {
            throw new BadRequestException("Số buổi học phải lớn hơn 0");
        }
        if (req.getTuitionFee() != null && req.getTuitionFee().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Học phí không được âm");
        }

        if (courseRepository.existsByCourseCode(req.getCourseCode().trim())) {
            throw new ConflictException("Mã khóa học đã tồn tại: " + req.getCourseCode().trim());
        }
        Course course = mapper.map(req, Course.class);
        course.setCourseCode(req.getCourseCode().trim());
        course.setCourseName(req.getCourseName().trim());
        return mapper.map(courseRepository.save(course), CourseResponse.class);
    }

    @Transactional
    @Override
    public CourseResponse update(Long id, CourseUpsertRequest req) {
        Course existing = courseRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Course not found: " + id));

        if (req.getCourseCode() == null || req.getCourseCode().trim().isEmpty()) {
            throw new BadRequestException("Mã khóa học không được để trống");
        }
        if (req.getCourseName() == null || req.getCourseName().trim().isEmpty()) {
            throw new BadRequestException("Tên khóa học không được để trống");
        }
        if (req.getTotalSession() <= 0) {
            throw new BadRequestException("Số buổi học phải lớn hơn 0");
        }
        if (req.getTuitionFee() != null && req.getTuitionFee().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Học phí không được âm");
        }

        if (existing.getCourseCode() != null && !existing.getCourseCode().equalsIgnoreCase(req.getCourseCode().trim())
                && courseRepository.existsByCourseCode(req.getCourseCode().trim())) {
            throw new ConflictException("Mã khóa học đã tồn tại: " + req.getCourseCode().trim());
        }
        mapper.map(req, existing);
        existing.setCourseCode(req.getCourseCode().trim());
        existing.setCourseName(req.getCourseName().trim());
        return mapper.map(courseRepository.save(existing), CourseResponse.class);
    }

    @Transactional
    @Override
    public void delete(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new NotFoundExeception("Course not found: " + id);
        }
        if (courseClassRepository != null && courseClassRepository.existsByCourseId(id)) {
            throw new ConflictException("Không thể xóa khóa học đã có lớp học liên kết.");
        }
        courseRepository.deleteById(id);
    }
}
