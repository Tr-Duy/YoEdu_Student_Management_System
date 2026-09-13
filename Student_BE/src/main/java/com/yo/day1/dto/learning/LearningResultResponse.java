package com.yo.day1.dto.learning;

import com.yo.day1.domain.enums.GradeClassification;
import com.yo.day1.domain.enums.GradeStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class LearningResultResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentCode;
    private Long courseClassId;
    private String courseClassName;
    private String className;

    private BigDecimal processScore;
    private BigDecimal midtermScore;
    private BigDecimal finalScore;
    private Integer totalScore;
    private GradeClassification classification;
    private GradeStatus status;
    private String teacherComment;
    private Double attendanceRate;

    private Long createdByUserId;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
