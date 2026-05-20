package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.dto.auth.AuthResponse;
import com.yo.day1.dto.auth.CurrentUserResponse;
import com.yo.day1.dto.auth.LoginRequest;
import com.yo.day1.dto.auth.RequestTokenRequest;
import com.yo.day1.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request), "Login successful");
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RequestTokenRequest request) {
        return ApiResponse.success(authService.refresh(request), "Token refreshed");
    }

    @GetMapping("/me")
    public ApiResponse<CurrentUserResponse> me(Authentication authentication) {
        return ApiResponse.success(authService.getCurrentUser(authentication.getName()));
    }
}
