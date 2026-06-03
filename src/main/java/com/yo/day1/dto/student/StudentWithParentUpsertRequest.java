package com.yo.day1.dto.student;

import com.yo.day1.domain.enums.Gender;
import com.yo.day1.domain.enums.StudentStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class StudentWithParentUpsertRequest {
    private String studentCode;
    private String fullName;
    private LocalDate dateOfBirth;
    private Gender gender = Gender.OTHER;
    private String gradeLevel;
    private String schoolName;
    private String phone;
    private String description;
    private StudentStatus status = StudentStatus.ACTIVE;
    private BigDecimal latestScore = BigDecimal.ZERO;
    private String studentNote;

    private String parentFullName;
    private String parentEmail;
    private String parentPhone;
    private String parentAddress;
    private Gender parentGender = Gender.OTHER;
    private String parentRelationship;
}
