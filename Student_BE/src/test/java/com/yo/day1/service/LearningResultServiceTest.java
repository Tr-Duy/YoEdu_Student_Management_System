package com.yo.day1.service;

import com.yo.day1.common.exception.ConflictException;
import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.entity.LearningResult;
import com.yo.day1.domain.entity.Student;
import com.yo.day1.domain.entity.Users;
import com.yo.day1.domain.enums.EnrollmentStatus;
import com.yo.day1.dto.learning.LearningResultCreateRequest;
import com.yo.day1.dto.learning.LearningResultResponse;
import com.yo.day1.repository.AttendanceRepository;
import com.yo.day1.repository.EnrollmentRepository;
import com.yo.day1.repository.LearningResultRepository;
import com.yo.day1.service.impl.LearningResultServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class LearningResultServiceTest {

    @Mock
    private LearningResultRepository repository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private AttendanceRepository attendanceRepository;
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
        user.setRole(com.yo.day1.domain.enums.UserRole.ADMIN);
        
        Student student = new Student();
        student.setId(1L);
        student.setFullName("Nguyễn Văn A");
        student.setStudentCode("HV001");
        
        CourseClass courseClass = new CourseClass();
        courseClass.setId(1L);
        courseClass.setName("Lớp 1");

        when(repository.existsByStudentIdAndCourseClassId(1L, 1L)).thenReturn(false);
        when(courseClassService.getCourseClass(1L)).thenReturn(courseClass);
        when(studentService.getStudent(1L)).thenReturn(student);
        when(enrollmentRepository.existsByStudentIdAndCourseClassIdAndStatus(1L, 1L, EnrollmentStatus.ACTIVE)).thenReturn(true);
        when(authService.findActiveUserByUsername("testuser")).thenReturn(user);
        
        LearningResult saved = new LearningResult();
        saved.setId(1L);
        saved.setStudent(student);
        saved.setCourseClass(courseClass);
        saved.setCreatedByUser(user);
        saved.setProcessScore(new BigDecimal("8.0"));
        saved.setMidtermScore(new BigDecimal("7.0"));
        saved.setFinalScore(new BigDecimal("9.0"));
        saved.setTotalScore(8);
        saved.setClassification(com.yo.day1.domain.enums.GradeClassification.GIOI);
        saved.setStatus(com.yo.day1.domain.enums.GradeStatus.DRAFT);
        
        when(repository.saveAndFlush(any(LearningResult.class))).thenReturn(saved);

        LearningResultResponse result = service.create(request, "testuser");

        assertThat(result).isNotNull();
        assertThat(result.getTotalScore()).isEqualTo(8);
        assertThat(result.getClassification()).isEqualTo(com.yo.day1.domain.enums.GradeClassification.GIOI);
    }

    @Test
    void createThrowsWhenDuplicate() {
        LearningResultCreateRequest request = buildRequest();

        when(repository.existsByStudentIdAndCourseClassId(1L, 1L)).thenReturn(true);

        assertThatThrownBy(() -> service.create(request, "testuser"))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Học viên này đã có bảng điểm trong lớp.");
    }

    // ==================== helpers ====================

    private LearningResultCreateRequest buildRequest() {
        LearningResultCreateRequest req = new LearningResultCreateRequest();
        req.setStudentId(1L);
        req.setCourseClassId(1L);
        req.setProcessScore(new BigDecimal("8.0"));
        req.setMidtermScore(new BigDecimal("7.0"));
        req.setFinalScore(new BigDecimal("9.0"));
        return req;
    }
}
