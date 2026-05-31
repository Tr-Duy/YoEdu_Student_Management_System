package com.yo.day1.repository;

import com.yo.day1.domain.entity.LearningResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LearningResultRepository extends JpaRepository<LearningResult, Long> {

    boolean existsByStudentIdAndCourseClassIdAndResultMonth(Long studentId, Long courseClassId, LocalDate resultMonth);

    List<LearningResult> findByStudentId(Long studentId);

    @Query("""
            SELECT r FROM LearningResult r
            WHERE r.courseClass.id = :classId
              AND YEAR(r.resultMonth) = :year
              AND MONTH(r.resultMonth) = :month
            ORDER BY r.student.fullName
            """)
    List<LearningResult> findByClassAndMonth(@Param("classId") Long classId,
                                             @Param("year") int year,
                                             @Param("month") int month);

    // Báo cáo học lực theo lớp/tháng
    @Query("""
            SELECT r.courseClass.id, r.courseClass.name,
                   COUNT(r), AVG(r.score), MAX(r.score), MIN(r.score),
                   SUM(CASE WHEN r.score >= 8.5 THEN 1 ELSE 0 END),
                   SUM(CASE WHEN r.score >= 7.0 AND r.score < 8.5 THEN 1 ELSE 0 END),
                   SUM(CASE WHEN r.score >= 5.0 AND r.score < 7.0 THEN 1 ELSE 0 END),
                   SUM(CASE WHEN r.score < 5.0 THEN 1 ELSE 0 END)
            FROM LearningResult r
            WHERE YEAR(r.resultMonth) = :year AND MONTH(r.resultMonth) = :month
              AND (:classId IS NULL OR r.courseClass.id = :classId)
            GROUP BY r.courseClass.id, r.courseClass.name
            """)
    List<Object[]> learningResultSummary(@Param("year") int year,
                                         @Param("month") int month,
                                         @Param("classId") Long classId);
}
