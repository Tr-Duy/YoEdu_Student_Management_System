package com.yo.day1.domain.entity;

import lombok.Data;

@Data
public class StudentCard {
    private Long id;
    private String studentCode;
    private String fullName;
    private String status;
    private float latestScore;
}