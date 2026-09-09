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
    @jakarta.validation.constraints.DecimalMin(value = "0.0", message = "Điểm số không được nhỏ hơn 0")
    @jakarta.validation.constraints.DecimalMax(value = "10.0", message = "Điểm số không được lớn hơn 10")
    private BigDecimal latestScore = BigDecimal.ZERO;
    private String studentNote;

    private String parentFullName;
    private String parentEmail;
    private String parentPhone;
    private String parentAddress;
    private Gender parentGender = Gender.OTHER;
    private String parentRelationship;
}
