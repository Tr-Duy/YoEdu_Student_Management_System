package com.yo.day1.service;

import com.yo.day1.domain.enums.TeacherRole;
import com.yo.day1.domain.enums.TeacherStatus;
import com.yo.day1.dto.teacher.TeacherResponse;
import com.yo.day1.dto.teacher.TeacherUpsertRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface TeacherService {
    Page<TeacherResponse> search(String search, TeacherStatus status, TeacherRole role, Boolean isActive, Pageable pageable);
    List<TeacherResponse> findAll(Boolean active);
    Optional<TeacherResponse> findById(Long id);
    TeacherResponse save(TeacherUpsertRequest req);
    TeacherResponse update(Long id, TeacherUpsertRequest req);
    void delete(Long id);
}
