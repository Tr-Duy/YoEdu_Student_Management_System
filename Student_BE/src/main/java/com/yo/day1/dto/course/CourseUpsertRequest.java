package com.yo.day1.dto.course;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CourseUpsertRequest {

    @NotBlank(message = "Mã khóa học không được để trống")
    @Size(max = 20, message = "Mã khóa học tối đa 20 ký tự")
    private String courseCode;

    @NotBlank(message = "Tên khóa học không được để trống")
    @Size(max = 100, message = "Tên khóa học tối đa 100 ký tự")
    private String courseName;

    private String courseDescription;

    @Min(value = 0, message = "Học phí không được âm")
    private double tuitionFee;

    @Min(value = 1, message = "Số buổi học phải lớn hơn 0")
    private int totalSession;

    @NotNull(message = "Trạng thái không được để trống")
    private Byte isActive;
}
