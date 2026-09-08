package com.yo.day1.service;

import com.yo.day1.common.exception.ConflictException;
import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.entity.LearningResult;
import com.yo.day1.domain.entity.Student;
import com.yo.day1.domain.entity.Users;
import com.yo.day1.dto.learning.LearningResultCreateRequest;
import com.yo.day1.dto.learning.LearningResultResponse;
import com.yo.day1.repository.LearningResultRepository;
import com.yo.day1.service.impl.LearningResultServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LearningResultServiceTest {

    @Mock
    private LearningResultRepository repository;
    @Mock
    private StudentService studentService;
    @Mock
    private CourseClassService courseClassService;
    @Mock
    private AuthService authService;
    @Mock
    private ModelMapper mapper;

    @InjectMocks
    private LearningResultServiceImpl service;

    // ==================== create ====================

    @Test
    void createSuccess() {
        LearningResultCreateRequest request = buildRequest();
        Users user = new Users();
        user.setId(1L);
        user.setUsername("testuser");
        
        Student student = new Student();
        student.setId(1L);
        
        CourseClass courseClass = new CourseClass();
        courseClass.setId(1L);

        when(repository.existsByStudentIdAndCourseClassIdAndResultMonth(1L, 1L, LocalDate.now())).thenReturn(false);
        when(authService.findActiveUserByUsername("testuser")).thenReturn(user);
        when(studentService.getStudent(1L)).thenReturn(student);
        when(courseClassService.getCourseClass(1L)).thenReturn(courseClass);
        
        LearningResult saved = new LearningResult();
        saved.setId(1L);
        saved.setStudent(student);
        saved.setCourseClass(courseClass);
        saved.setCreatedByUser(user);
        
        when(repository.saveAndFlush(any(LearningResult.class))).thenReturn(saved);
        when(mapper.map(any(LearningResult.class), eq(LearningResultResponse.class))).thenReturn(new LearningResultResponse());

        LearningResultResponse result = service.create(request, "testuser");

        assertThat(result).isNotNull();
    }

    @Test
    void createThrowsWhenExists() {
        LearningResultCreateRequest request = buildRequest();

        when(repository.existsByStudentIdAndCourseClassIdAndResultMonth(1L, 1L, LocalDate.now())).thenReturn(true);

        assertThatThrownBy(() -> service.create(request, "testuser"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Learning result already exists");
    }

    // ==================== helpers ====================

    private LearningResultCreateRequest buildRequest() {
        LearningResultCreateRequest req = new LearningResultCreateRequest();
        req.setStudentId(1L);
        req.setCourseClassId(1L);
        req.setResultMonth(LocalDate.now());
        return req;
    }
}
