package com.yo.day1.dto.teacher;

import com.yo.day1.domain.enums.TeacherRole;
import com.yo.day1.domain.enums.TeacherStatus;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class TeacherResponse {
    private Long id;
    private String teacherCode;
    private String fullName;
    private String phone;
    private String email;
    private TeacherRole teacherRole;
    private TeacherStatus status;
    private Boolean isActive;
    private LocalDate dateOfBirth;
    private BigDecimal salary;
    private Integer weeklySlots;
    private String address;
    private String description;
    private String workUnit;
    private String experience;
    private String achievement;
    private String cccdImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
