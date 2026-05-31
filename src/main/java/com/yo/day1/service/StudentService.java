package com.yo.day1.service;

import com.yo.day1.domain.entity.Student;
import com.yo.day1.domain.enums.StudentStatus;
import com.yo.day1.dto.student.StudentResponse;
import com.yo.day1.dto.student.StudentUpsertRequest;
import com.yo.day1.dto.student.ChangeStudentStatusRequest;
import com.yo.day1.dto.student.StudentStatusHistoryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface StudentService {
    Page<StudentResponse> search(String search, StudentStatus status, String gradeLevel, Pageable pageable);
    List<StudentResponse> findByAll();
    Optional<StudentResponse> findById(long id);
    StudentResponse create(StudentUpsertRequest req);
    StudentResponse update(Long id, StudentUpsertRequest req);
    Optional<StudentResponse> findByStudentCode(String studentCode);
    List<StudentResponse> findByStatus(StudentStatus status);
    void deleteById(Long id);
    Student getStudent(Long id);
    Student getStudentForParent(Long studentId, Long parentId);
    List<StudentResponse> searchByName(String name);
    StudentResponse changeStatus(Long id, ChangeStudentStatusRequest request, Long changedByUserId);
    List<StudentStatusHistoryResponse> getStatusHistory(Long studentId);
}
