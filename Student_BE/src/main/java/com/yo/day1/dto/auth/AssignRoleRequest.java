package com.yo.day1.dto.auth;

import com.yo.day1.domain.enums.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignRoleRequest {
    @NotNull
    private UserRole role;
}
