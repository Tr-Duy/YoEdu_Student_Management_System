package com.yo.day1.service.impl;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.RefreshTokenSession;
import com.yo.day1.domain.entity.Users;
import com.yo.day1.dto.auth.AuthResponse;
import com.yo.day1.dto.auth.CurrentUserResponse;
import com.yo.day1.dto.auth.LoginRequest;
import com.yo.day1.dto.auth.ChangePasswordRequest;
import com.yo.day1.dto.auth.RequestTokenRequest;
import com.yo.day1.repository.RefreshTokenSessionRepository;
import com.yo.day1.repository.UserRepository;
import com.yo.day1.security.JwtService;
import com.yo.day1.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenSessionRepository refreshTokenSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final HttpServletRequest httpRequest;

    @Override
    public CurrentUserResponse getCurrentUser(String username) {
        if (username == null || username.isBlank()) {
            throw new BadRequestException("Username không được để trống");
        }
        Users user = userRepository.findByUsernameAndIsActiveTrue(username)
                .orElseThrow(() -> new NotFoundExeception("User not found or inactive: " + username));
        return buildCurrentUser(user);
    }

    @Override
    public Users findActiveUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .orElseThrow(() -> new NotFoundExeception("User not found or inactive: " + username));
    }

    @Override
    public AuthResponse buildTokensForUser(Users user, String rawPassword) {
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        String refreshJti = jwtService.extractJti(refreshToken);
        Instant refreshExpiry = jwtService.extractExpiration(refreshToken);

        RefreshTokenSession session = new RefreshTokenSession();
        session.setJti(refreshJti);
        session.setUser(user);
        session.setExpiresAt(refreshExpiry);
        session.setIsRevoked(false);
        session.setIpAddress(httpRequest.getRemoteAddr());
        session.setUserAgent(httpRequest.getHeader("User-Agent"));
        refreshTokenSessionRepository.save(session);

        return new AuthResponse(
                accessToken,
                refreshToken,
                "Bearer",
                jwtService.extractExpiration(accessToken),
                refreshExpiry,
                buildCurrentUser(user)
        );
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Users user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        return buildTokensForUser(user, request.password());
    }

    @Override
    @Transactional
    public AuthResponse refresh(RequestTokenRequest request) {
        String refreshToken = request.refreshToken();

        if (!jwtService.validateToken(refreshToken) || jwtService.isAccessToken(refreshToken)) {
            throw new BadCredentialsException("Invalid refresh token");
        }

        String jti = jwtService.extractJti(refreshToken);

        RefreshTokenSession session = refreshTokenSessionRepository.findByJtiAndIsRevokedFalse(jti)
                .orElseThrow(() -> new BadCredentialsException("Refresh token revoked or not found"));

        if (session.getExpiresAt().isBefore(Instant.now())) {
            throw new BadCredentialsException("Refresh token expired");
        }

        // thu hồi session cũ
        session.setIsRevoked(true);
        session.setRevokedAt(Instant.now());

        // tạo token mới
        Users refreshUser = session.getUser();
        String newAccessToken = jwtService.generateAccessToken(refreshUser);
        String newRefreshToken = jwtService.generateRefreshToken(refreshUser);
        String newJti = jwtService.extractJti(newRefreshToken);
        Instant newRefreshExpiry = jwtService.extractExpiration(newRefreshToken);

        session.setReplacedByJti(newJti);
        refreshTokenSessionRepository.save(session);

        // lưu session mới
        RefreshTokenSession newSession = new RefreshTokenSession();
        newSession.setJti(newJti);
        newSession.setUser(session.getUser());
        newSession.setExpiresAt(newRefreshExpiry);
        newSession.setIsRevoked(false);
        newSession.setIpAddress(httpRequest.getRemoteAddr());
        newSession.setUserAgent(httpRequest.getHeader("User-Agent"));
        refreshTokenSessionRepository.save(newSession);

        return new AuthResponse(
                newAccessToken,
                newRefreshToken,
                "Bearer",
                jwtService.extractExpiration(newAccessToken),
                newRefreshExpiry,
                buildCurrentUser(session.getUser())
        );
    }

    @Override
    public void changePassword(String username, ChangePasswordRequest request) {
        Users user = findActiveUserByUsername(username);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private CurrentUserResponse buildCurrentUser(Users user) {
        return new CurrentUserResponse(
                user.getId(),
                user.getUsername(),
                user.getFullName(),
                user.getRole().name(),
                user.getParent() != null ? user.getParent().getId() : null,
                user.getTeacher() != null ? user.getTeacher().getId() : null
        );
    }
}
