package com.yo.day1.service;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.Users;
import com.yo.day1.dto.auth.AuthResponse;
import com.yo.day1.dto.auth.CurrentUserResponse;
import com.yo.day1.dto.auth.LoginRequest;
import com.yo.day1.dto.auth.RequestTokenRequest;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(RequestTokenRequest request);
    AuthResponse buildTokensForUser(Users user, String rawPassword);
    CurrentUserResponse getCurrentUser(String username) throws BadRequestException, NotFoundExeception;
    Users findActiveUserByUsername(String username) throws NotFoundExeception;
}
