package com.yo.day1.controllers;

import com.yo.day1.common.ApiResponse;
import com.yo.day1.dto.auth.AssignRoleRequest;
import com.yo.day1.dto.auth.AuthResponse;
import com.yo.day1.dto.auth.ChangePasswordRequest;
import com.yo.day1.dto.auth.CreateUserRequest;
import com.yo.day1.dto.auth.CurrentUserResponse;
import com.yo.day1.dto.auth.LoginRequest;
import com.yo.day1.dto.auth.RequestTokenRequest;
import com.yo.day1.service.AuthService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestBody RequestTokenRequest request) {
        authService.logout(request.refreshToken());
        return ApiResponse.successMessage("Logged out successfully");
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(Authentication authentication,
                                            @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(authentication.getName(), request);
        return ApiResponse.successMessage("Password changed successfully");
    }

    @GetMapping("/me")
    public ApiResponse<CurrentUserResponse> me(Authentication authentication) {
        return ApiResponse.success(authService.getCurrentUser(authentication.getName()));
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CurrentUserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ApiResponse.success(authService.createUser(request), "User created");
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<CurrentUserResponse>> listUsers() {
        return ApiResponse.success(authService.listUsers());
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CurrentUserResponse> getUserById(@PathVariable Long id) {
        return ApiResponse.success(authService.getUserById(id));
    }

    @PatchMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CurrentUserResponse> assignRole(@PathVariable Long id,
                                                       @Valid @RequestBody AssignRoleRequest request) {
        return ApiResponse.success(authService.assignRole(id, request), "Role assigned");
    }

    @PatchMapping("/users/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CurrentUserResponse> toggleActive(@PathVariable Long id) {
        return ApiResponse.success(authService.toggleActive(id), "User status updated");
    }

    @PostMapping("/users/{userId}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> resetPasswordForParent(@PathVariable Long userId, @RequestBody ResetPasswordRequest request) {
        authService.resetPasswordForParent(userId, request.newPassword());
        return ApiResponse.successMessage("Password reset successfully");
    }

    record ResetPasswordRequest(String newPassword) {}
}
