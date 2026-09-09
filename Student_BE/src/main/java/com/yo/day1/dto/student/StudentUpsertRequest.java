package com.yo.day1.dto.student;
//Đây là DTO nhận data từ client khi tạo mới hoặc cập nhật Student (Upsert = Update + Insert).
import com.yo.day1.domain.enums.Gender;
import com.yo.day1.domain.enums.StudentStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
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

    @jakarta.validation.constraints.DecimalMin(value = "0.0", message = "Điểm số không được nhỏ hơn 0")
    @jakarta.validation.constraints.DecimalMax(value = "10.0", message = "Điểm số không được lớn hơn 10")
    private BigDecimal latestScore = BigDecimal.ZERO;

    private String note;

    private LocalDate createdDate;

    private LocalDate updatedDate;
}
