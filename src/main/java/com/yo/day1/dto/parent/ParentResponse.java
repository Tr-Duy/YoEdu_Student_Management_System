package com.yo.day1.dto.parent;

import com.yo.day1.domain.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ParentResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private Gender gender;
    private String relationship;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
