package com.yo.day1.service;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.domain.entity.Users;
import com.yo.day1.domain.enums.UserRole;
import com.yo.day1.dto.auth.CurrentUserResponse;
import com.yo.day1.repository.ParentRepository;
import com.yo.day1.repository.RefreshTokenSessionRepository;
import com.yo.day1.repository.TeacherRepository;
import com.yo.day1.repository.UserRepository;
import com.yo.day1.security.JwtService;
import com.yo.day1.service.impl.AuthServiceImpl;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RefreshTokenSessionRepository refreshTokenSessionRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private HttpServletRequest httpRequest;
    @Mock
    private ParentRepository parentRepository;
    @Mock
    private TeacherRepository teacherRepository;

    @InjectMocks
    private AuthServiceImpl service;

    // ==================== getCurrentUser ====================

    @Test
    void getCurrentUserSuccess() {
        Users user = new Users();
        user.setId(1L);
        user.setUsername("testuser");
        user.setRole(UserRole.ADMIN);

        when(userRepository.findByUsernameAndIsActiveTrue("testuser")).thenReturn(Optional.of(user));

        CurrentUserResponse result = service.getCurrentUser("testuser");

        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.username()).isEqualTo("testuser");
    }

    @Test
    void getCurrentUserThrowsWhenBlank() {
        assertThatThrownBy(() -> service.getCurrentUser(""))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Username không được để trống");
    }
}
