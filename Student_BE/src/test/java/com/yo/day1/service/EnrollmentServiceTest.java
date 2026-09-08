package com.yo.day1.service;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.entity.Enrollment;
import com.yo.day1.domain.entity.ScheduleSlot;
import com.yo.day1.domain.entity.Student;
import com.yo.day1.domain.enums.ClassStatus;
import com.yo.day1.domain.enums.EnrollmentStatus;
import com.yo.day1.dto.enrollment.EnrollmentCreateRequest;
import com.yo.day1.dto.enrollment.EnrollmentResponse;
import com.yo.day1.repository.CourseClassRepository;
import com.yo.day1.repository.EnrollmentRepository;
import com.yo.day1.service.impl.EnrollmentServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EnrollmentServiceTest {

    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private CourseClassRepository courseClassRepository;
    @Mock
    private StudentService studentService;
    @Mock
    private CourseClassService courseClassService;
    @Mock
    private ModelMapper mapper;

    @InjectMocks
    private EnrollmentServiceImpl service;

    // ==================== create ====================

    @Test
    void createSuccess() {
        EnrollmentCreateRequest request = buildRequest();
        
        CourseClass courseClass = new CourseClass();
        courseClass.setId(1L);
        courseClass.setStatus(ClassStatus.OPEN);
        courseClass.setMaxStudents(30);
        ScheduleSlot slot = new ScheduleSlot();
        slot.setId(1L);
        courseClass.setScheduleSlot(slot);
        
        Student student = new Student();
        student.setId(1L);
        
        when(enrollmentRepository.existsByStudentIdAndCourseClassIdAndStatus(1L, 1L, EnrollmentStatus.ACTIVE)).thenReturn(false);
        when(courseClassService.getCourseClass(1L)).thenReturn(courseClass);
        when(enrollmentRepository.countByCourseClassIdAndStatus(1L, EnrollmentStatus.ACTIVE)).thenReturn(10L);
        when(enrollmentRepository.hasScheduleConflict(1L, 1L, 1L)).thenReturn(false);
        when(studentService.getStudent(1L)).thenReturn(student);
        
        Enrollment saved = new Enrollment();
        saved.setId(1L);
        saved.setStudent(student);
        saved.setCourseClass(courseClass);
        
        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(saved);
        when(mapper.map(any(Enrollment.class), eq(EnrollmentResponse.class))).thenReturn(new EnrollmentResponse());
        
        EnrollmentResponse result = service.create(request);
        
        assertThat(result).isNotNull();
    }

    @Test
    void createThrowsWhenClassClosed() {
        EnrollmentCreateRequest request = buildRequest();
        
        CourseClass courseClass = new CourseClass();
        courseClass.setId(1L);
        courseClass.setStatus(ClassStatus.CLOSED);
        
        when(enrollmentRepository.existsByStudentIdAndCourseClassIdAndStatus(1L, 1L, EnrollmentStatus.ACTIVE)).thenReturn(false);
        when(courseClassService.getCourseClass(1L)).thenReturn(courseClass);
        
        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Lớp học đã đóng, không thể đăng ký");
    }

    // ==================== drop ====================

    @Test
    void dropSuccess() {
        Enrollment enrollment = new Enrollment();
        enrollment.setId(1L);
        enrollment.setStatus(EnrollmentStatus.ACTIVE);
        CourseClass courseClass = new CourseClass();
        courseClass.setStatus(ClassStatus.OPEN);
        enrollment.setCourseClass(courseClass);
        Student student = new Student();
        enrollment.setStudent(student);

        when(enrollmentRepository.findById(1L)).thenReturn(Optional.of(enrollment));
        when(enrollmentRepository.save(any(Enrollment.class))).thenReturn(enrollment);
        when(mapper.map(any(Enrollment.class), eq(EnrollmentResponse.class))).thenReturn(new EnrollmentResponse());

        EnrollmentResponse result = service.drop(1L);

        assertThat(result).isNotNull();
        assertThat(enrollment.getStatus()).isEqualTo(EnrollmentStatus.DROPPED);
    }

    // ==================== helpers ====================

    private EnrollmentCreateRequest buildRequest() {
        EnrollmentCreateRequest req = new EnrollmentCreateRequest();
        req.setStudentId(1L);
        req.setCourseClassId(1L);
        req.setStatus(EnrollmentStatus.ACTIVE);
        return req;
    }
}
