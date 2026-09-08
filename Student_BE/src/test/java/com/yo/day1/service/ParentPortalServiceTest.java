package com.yo.day1.service;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.domain.entity.Parent;
import com.yo.day1.domain.entity.Users;
import com.yo.day1.domain.enums.UserRole;
import com.yo.day1.dto.parent.ParentDashboardResponse;
import com.yo.day1.repository.NotificationRepository;
import com.yo.day1.repository.TuitionInvoiceRepository;
import com.yo.day1.service.impl.ParentPortalServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ParentPortalServiceTest {

    @Mock
    private AuthService authService;
    @Mock
    private StudentService studentService;
    @Mock
    private TuitionInvoiceRepository tuitionInvoiceRepository;
    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private ParentPortalServiceImpl service;

    // ==================== getDashboard ====================

    @Test
    void getDashboardSuccess() {
        Users user = new Users();
        user.setUsername("parentuser");
        user.setRole(UserRole.PARENT);
        Parent parent = new Parent();
        parent.setId(1L);
        parent.setFullName("Parent Name");
        user.setParent(parent);

        when(authService.findActiveUserByUsername("parentuser")).thenReturn(user);
        when(studentService.findByParentId(1L)).thenReturn(Collections.emptyList());
        when(tuitionInvoiceRepository.findByStudentParentId(1L)).thenReturn(Collections.emptyList());
        when(notificationRepository.findByRecipientTypeAndRecipientRefIdOrderByCreatedAtDesc(any(), eq(1L))).thenReturn(Collections.emptyList());

        ParentDashboardResponse result = service.getDashboard("parentuser");

        assertThat(result).isNotNull();
        assertThat(result.getParentId()).isEqualTo(1L);
    }

    @Test
    void getDashboardThrowsWhenNotParent() {
        Users user = new Users();
        user.setUsername("adminuser");
        user.setRole(UserRole.ADMIN);

        when(authService.findActiveUserByUsername("adminuser")).thenReturn(user);

        assertThatThrownBy(() -> service.getDashboard("adminuser"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Current user is not a parent account");
    }
}
