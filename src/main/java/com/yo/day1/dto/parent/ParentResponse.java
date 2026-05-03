package com.yo.day1.dto.parent;

import com.yo.day1.domain.enums.Gender;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ParentResponse {

    private long id;

    private String fullName;

    private String email;

    private String phone;

    private String address;

    private Gender gender = Gender.OTHER;

    private String Relationship;

}
