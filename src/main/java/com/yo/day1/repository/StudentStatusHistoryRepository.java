package com.yo.day1.repository;

import com.yo.day1.domain.entity.StudentStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentStatusHistoryRepository extends JpaRepository<StudentStatusHistory, Long> {
    List<StudentStatusHistory> findByStudentIdOrderByChangedAtDesc(Long studentId);
}
