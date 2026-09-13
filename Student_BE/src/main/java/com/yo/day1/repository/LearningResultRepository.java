package com.yo.day1.repository;

import com.yo.day1.domain.entity.LearningResult;
import com.yo.day1.domain.enums.GradeClassification;
import com.yo.day1.domain.enums.GradeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LearningResultRepository extends JpaRepository<LearningResult, Long> {

    boolean existsByStudentIdAndCourseClassId(Long studentId, Long courseClassId);

    List<LearningResult> findByStudentId(Long studentId);

    List<LearningResult> findByCourseClassId(Long courseClassId);

    // Báo cáo học lực theo lớp
    @Query("""
            SELECT r.courseClass.id, r.courseClass.name,
                   COUNT(r), AVG(r.totalScore), MAX(r.totalScore), MIN(r.totalScore),
                   SUM(CASE WHEN r.totalScore >= 8 THEN 1 ELSE 0 END),
                   SUM(CASE WHEN r.totalScore >= 7 AND r.totalScore < 8 THEN 1 ELSE 0 END),
                   SUM(CASE WHEN r.totalScore > 5 AND r.totalScore < 7 THEN 1 ELSE 0 END),
                   SUM(CASE WHEN r.totalScore <= 5 THEN 1 ELSE 0 END)
            FROM LearningResult r
            WHERE (:classId IS NULL OR r.courseClass.id = :classId)
            GROUP BY r.courseClass.id, r.courseClass.name
            """)
    List<Object[]> learningResultSummary(@Param("classId") Long classId);

    @Query("""
            SELECT r FROM LearningResult r
            WHERE (:studentName IS NULL OR LOWER(r.student.fullName) LIKE LOWER(CONCAT('%', :studentName, '%')) OR LOWER(r.student.studentCode) LIKE LOWER(CONCAT('%', :studentName, '%')))
              AND (:courseClassId IS NULL OR r.courseClass.id = :courseClassId)
              AND (:courseId IS NULL OR r.courseClass.course.id = :courseId)
              AND (:teacherId IS NULL OR r.courseClass.mainTeacher.id = :teacherId OR r.courseClass.assistantTeacher.id = :teacherId)
              AND (:classification IS NULL OR r.classification = :classification)
              AND (:status IS NULL OR r.status = :status)
            ORDER BY r.student.fullName ASC
            """)
    List<LearningResult> searchLearningResults(
            @Param("studentName") String studentName,
            @Param("courseClassId") Long courseClassId,
            @Param("courseId") Long courseId,
            @Param("teacherId") Long teacherId,
            @Param("classification") GradeClassification classification,
            @Param("status") GradeStatus status);
}
