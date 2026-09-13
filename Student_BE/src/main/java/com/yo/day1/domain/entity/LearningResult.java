package com.yo.day1.domain.entity;

import com.yo.day1.domain.AuditableEntity;
import com.yo.day1.domain.enums.GradeClassification;
import com.yo.day1.domain.enums.GradeStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "learning_results", uniqueConstraints = @UniqueConstraint(name = "uq_learning_result", columnNames = {
        "student_id", "course_class_id" }))
public class LearningResult extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_class_id", nullable = false)
    private CourseClass courseClass;

    @Column(name = "process_score", precision = 4, scale = 2)
    private BigDecimal processScore;

    @Column(name = "midterm_score", precision = 4, scale = 2)
    private BigDecimal midtermScore;

    @Column(name = "final_score", precision = 4, scale = 2)
    private BigDecimal finalScore;

    @Column(name = "total_score")
    private Integer totalScore;

    @Column(name = "teacher_comment", columnDefinition = "TEXT")
    private String teacherComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private Users createdByUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "classification", length = 20)
    private GradeClassification classification;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private GradeStatus status = GradeStatus.DRAFT;
}
