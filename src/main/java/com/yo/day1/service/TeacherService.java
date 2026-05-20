package com.yo.day1.service;

import com.yo.day1.dto.teacher.TeacherResponse;
import com.yo.day1.dto.teacher.TeacherUpsertRequest;

import java.util.List;
import java.util.Optional;

public interface TeacherService {
    List<TeacherResponse> findAll(Boolean active);
    Optional<TeacherResponse> findById(Long id);
    TeacherResponse save(TeacherUpsertRequest req);
    TeacherResponse update(Long id, TeacherUpsertRequest req);
    void delete(Long id);
}
