package com.yo.day1.service;

import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.dto.StudentResponse;
import com.yo.day1.dto.StudentUpsertRequest;

import java.util.List;
import java.util.Optional;

public interface StudentService {
    List<StudentResponse> findByAll();
    Optional<StudentResponse> findById(long id);
    StudentResponse create(StudentUpsertRequest req);
    StudentResponse update(Long id, StudentUpsertRequest req);

    void deleteById(Long id);
}
