package com.yo.day1.dto.learning;

import com.yo.day1.domain.enums.GradeClassification;
import com.yo.day1.domain.enums.GradeStatus;
import lombok.Data;

@Data
public class LearningResultSearchRequest {
    private String studentName;
    private Long courseClassId;
    private Long courseId;
    private Long teacherId;
    private GradeClassification classification;
    private GradeStatus status;
}
