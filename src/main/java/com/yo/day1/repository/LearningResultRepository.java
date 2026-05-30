package com.yo.day1.repository;

import com.yo.day1.domain.entity.LearningResult;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningResultRepository extends JpaRepository<LearningResult, Long> {

    boolean existsByStudentIdAndCourseClassIdAndResultMonth(Long studentId, Long courseClassId,
                                                            java.time.LocalDate resultMonth);

    java.util.List<LearningResult> findByStudentId(Long studentId);
}
