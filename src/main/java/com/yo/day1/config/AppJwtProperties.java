package com.yo.day1.config;
//File này đọc cấu hình JWT từ application.yml và validate các giá trị đó khi khởi động app.
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.jwt")
public record AppJwtProperties(
        @NotBlank
        String issuer ,         // tên app phát hành token, không được để trống
        // VD: "yo-app", "my-company"

        @NotBlank String secret    ,      // khóa bí mật để ký JWT, không được để trống
        // càng dài càng bảo mật

        @Min(1) long accessTokenTtlMinutes,  // thời gian sống của access token (phút)
       // tối thiểu 1 phút, thường 15-30 phút

        @Min(1) long refreshTokenTtlDays    // thời gian sống của refresh token (ngày)
        // tối thiểu 1 ngày, thường 7-30 ngày
) {
}
