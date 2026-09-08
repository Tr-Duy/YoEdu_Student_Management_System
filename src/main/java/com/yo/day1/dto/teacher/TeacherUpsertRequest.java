package com.yo.day1.dto.teacher;

import com.yo.day1.domain.enums.TeacherRole;
import com.yo.day1.domain.enums.TeacherStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TeacherUpsertRequest {

    @NotBlank(message = "Mã giáo viên không được để trống")
    @Size(max = 20, message = "Mã giáo viên tối đa 20 ký tự")
    private String teacherCode;

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{9,11}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    @Size(max = 100, message = "Email tối đa 100 ký tự")
    private String email;

    @NotNull(message = "Vai trò không được để trống")
    private TeacherRole teacherRole;

    @NotNull(message = "Trạng thái không được để trống")
    private TeacherStatus status;

    private Boolean isActive = true;
    private LocalDate dateOfBirth;
    private BigDecimal salary;
    private Integer weeklySlots;
    private String address;
    private String description;
    private String workUnit;
    private String experience;
    private String achievement;
    private String cccdImageUrl;
}
