package com.yo.day1.repository;

import com.yo.day1.domain.entity.Student;
import com.yo.day1.domain.enums.StudentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByStudentCode(String studentCode);
    List<Student> findByStatus(StudentStatus status);
}
