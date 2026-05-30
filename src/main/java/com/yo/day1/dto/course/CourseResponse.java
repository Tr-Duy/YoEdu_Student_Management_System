package com.yo.day1.dto.course;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class CourseResponse {
    private Long id;
    private String courseCode;
    private String courseName;
    private String courseDescription;
    private double tuitionFee;
    private int totalSession;
    private byte isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
