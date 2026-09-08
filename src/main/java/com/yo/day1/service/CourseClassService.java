package com.yo.day1.service;

import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.enums.ClassStatus;
import com.yo.day1.dto.courseclass.CourseClassCreateRequest;
import com.yo.day1.dto.courseclass.CourseClassResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CourseClassService {
    Page<CourseClassResponse> search(String search, ClassStatus status, Long courseId, Long teacherId, Pageable pageable);
    Page<CourseClassResponse> findAll(String search, Pageable pageable);
    List<CourseClassResponse> findByCourseId(Long courseId);
    List<CourseClassResponse> findByStudentId(Long studentId);
    CourseClassResponse findById(Long id);
    CourseClassResponse create(CourseClassCreateRequest request);
    CourseClassResponse update(Long id, CourseClassCreateRequest request);
    void delete(Long id);
    CourseClass getCourseClass(Long id);
}
