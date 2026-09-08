package com.yo.day1.service;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.Users;
import com.yo.day1.dto.auth.AuthResponse;
import com.yo.day1.dto.auth.CurrentUserResponse;
import com.yo.day1.dto.auth.LoginRequest;
import com.yo.day1.dto.auth.ChangePasswordRequest;
import com.yo.day1.dto.auth.RequestTokenRequest;

import com.yo.day1.dto.auth.AssignRoleRequest;
import com.yo.day1.dto.auth.CreateUserRequest;

import java.util.List;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(RequestTokenRequest request);
    AuthResponse buildTokensForUser(Users user, String rawPassword);
    CurrentUserResponse getCurrentUser(String username) throws BadRequestException, NotFoundExeception;
    Users findActiveUserByUsername(String username) throws NotFoundExeception;
    void changePassword(String username, ChangePasswordRequest request);
    CurrentUserResponse createUser(CreateUserRequest request);
    void resetPasswordForParent(Long parentUserId, String newPassword);
    List<CurrentUserResponse> listUsers();
    CurrentUserResponse getUserById(Long id);
    CurrentUserResponse assignRole(Long id, AssignRoleRequest request);
    CurrentUserResponse toggleActive(Long id);
    void logout(String refreshToken);
}
