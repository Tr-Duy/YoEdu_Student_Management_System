package com.yo.day1.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record RequestTokenRequest(
        @NotBlank String refreshToken
) {
}
