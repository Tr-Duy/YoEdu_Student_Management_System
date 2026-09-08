package com.yo.day1.dto.parent;

import com.yo.day1.domain.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ParentUpsertRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
    private String fullName;

    @Size(max = 100, message = "Email tối đa 100 ký tự")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{9,11}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    @Size(max = 200, message = "Địa chỉ tối đa 200 ký tự")
    private String address;

    private Gender gender = Gender.OTHER;

    @Size(max = 50, message = "Quan hệ tối đa 50 ký tự")
    private String relationship;
}
