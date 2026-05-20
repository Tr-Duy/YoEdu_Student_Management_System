package com.yo.day1.repository;

import com.yo.day1.domain.entity.Teacher;
import com.yo.day1.domain.enums.TeacherStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    List<Teacher> findByStatus(TeacherStatus status);
    List<Teacher> findByIsActive(Boolean isActive);
    Optional<Teacher> findByTeacherCode(String teacherCode);
    boolean existsByTeacherCode(String teacherCode);
    boolean existsByPhone(String phone);
}
