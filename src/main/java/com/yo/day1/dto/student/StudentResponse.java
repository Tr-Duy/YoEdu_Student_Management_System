package com.yo.day1.dto.student;
//Đây là DTO (Data Transfer Object) — định nghĩa data trả về cho client khi query thông tin Student.
import com.yo.day1.domain.enums.Gender;
import com.yo.day1.domain.enums.StudentStatus;
import com.yo.day1.dto.parent.ParentResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StudentResponse {
    private long id;
    private String studentCode;

    private String fullName;

    private LocalDate dateOfBirth;


    private Gender gender = Gender.OTHER; // giới tính, mặc định OTHER

    private String gradeLevel;

    private String schoolName;

    private String phone;

    private String description;


    private ParentResponse parent;

    private StudentStatus status = StudentStatus.ACTIVE; // trạng thái, mặc định ACTIVE

    private BigDecimal latestScore = BigDecimal.ZERO;// điểm mới nhất, mặc định 0

    private String note;

    private LocalDate createdDate;


    private LocalDate updatedDate;
}
