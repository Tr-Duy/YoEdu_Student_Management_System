package com.yo.day1.domain.entity;

import com.yo.day1.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "learning_results", uniqueConstraints = @UniqueConstraint(name = "uq_learning_result", columnNames = {
        "student_id", "course_class_id", "result_month" }))
public class LearningResult extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_class_id", nullable = false)
    private CourseClass courseClass;

    @Column(name = "result_month", nullable = false)
    private LocalDate resultMonth;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "teacher_comment", columnDefinition = "TEXT")
    private String teacherComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private Users createdByUser;
}
