package com.yo.day1.service;

import com.yo.day1.dto.course.CourseResponse;
import com.yo.day1.dto.course.CourseUpsertRequest;

import java.util.List;
import java.util.Optional;

public interface CourseService {
    List<CourseResponse> findAll();
    List<CourseResponse> findAll(String search);
    Optional<CourseResponse> findById(Long id);
    CourseResponse save(CourseUpsertRequest req);
    CourseResponse update(Long id, CourseUpsertRequest req);
    void delete(Long id);
}

