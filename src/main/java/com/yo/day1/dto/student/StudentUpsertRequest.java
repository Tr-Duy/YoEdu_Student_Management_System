package com.yo.day1.dto.student;

import com.yo.day1.domain.enums.Gender;
import com.yo.day1.domain.enums.StudentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public class StudentUpsertRequest {
    private String studentCode;

    private String fullName;

    private LocalDate dateOfBirth;


    private Gender gender = Gender.OTHER;

    private String gradeLevel;

    private String schoolName;

    private String phone;

    private String description;


    private Long parentId;

    private StudentStatus status = StudentStatus.ACTIVE;

    private BigDecimal latestScore = BigDecimal.ZERO;

    private String note;

    private LocalDate createdDate;

    private LocalDate updatedDate;
}
