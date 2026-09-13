package com.yo.day1.repository;

import com.yo.day1.domain.entity.Student;
import com.yo.day1.domain.enums.StudentStatus;
import com.yo.day1.dto.student.StudentResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long>, JpaSpecificationExecutor<Student> {
    Optional<Student> findByStudentCode(String studentCode);
    boolean existsByStudentCode(String studentCode);
    boolean existsByParentId(Long parentId);
    List<Student> findByStatus(StudentStatus status);
    List<Student> findByFullNameContainingIgnoreCase(String name);
    List<StudentResponse> findByParentId(Long parentId);
    long countByStatus(StudentStatus status);

    @Query("SELECT COUNT(s) FROM Student s")
    long countAll();
}
