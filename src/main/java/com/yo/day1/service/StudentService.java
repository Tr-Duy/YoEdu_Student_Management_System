package com.yo.day1.service;

import com.yo.day1.domain.enums.StudentStatus;
import com.yo.day1.dto.student.StudentResponse;
import com.yo.day1.dto.student.StudentUpsertRequest;

import java.util.List;
import java.util.Optional;

public interface StudentService {
    List<StudentResponse> findByAll();
    Optional<StudentResponse> findById(long id);
    StudentResponse create(StudentUpsertRequest req);
    StudentResponse update(Long id, StudentUpsertRequest req);

    Optional<StudentResponse> findByStudentCode(String studentCode);
    List<StudentResponse> findByStatus(StudentStatus status);
    void deleteById(Long id);
}
