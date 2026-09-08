package com.yo.day1.service;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.domain.entity.*;
import com.yo.day1.domain.enums.AttendanceStatus;
import com.yo.day1.domain.enums.EnrollmentStatus;
import com.yo.day1.domain.enums.StudentStatus;
import com.yo.day1.dto.attendance.AttendanceCreateRequest;
import com.yo.day1.dto.attendance.AttendanceResponse;
import com.yo.day1.repository.*;
import com.yo.day1.service.impl.AttendanceServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AttendanceServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private CourseClassRepository courseClassRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private AuthService authService;
    @Mock
    private ModelMapper mapper;

    @InjectMocks
    private AttendanceServiceImpl service;

    // ==================== create ====================

    @Test
    void createSuccess() {
        AttendanceCreateRequest request = buildRequest();
        Student student = new Student();
        student.setId(1L);
        student.setStatus(StudentStatus.ACTIVE);
        
        CourseClass courseClass = new CourseClass();
        courseClass.setId(1L);
        courseClass.setStartDate(LocalDate.now().minusDays(1));
        
        Users user = new Users();
        user.setId(1L);
        user.setUsername("testuser");

        when(courseClassRepository.findById(1L)).thenReturn(Optional.of(courseClass));
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.existsByStudentIdAndCourseClassIdAndStatus(1L, 1L, EnrollmentStatus.ACTIVE)).thenReturn(true);
        when(attendanceRepository.findByCourseClassIdAndStudentIdAndAttendanceDate(1L, 1L, LocalDate.now())).thenReturn(Optional.empty());
        when(authService.findActiveUserByUsername("testuser")).thenReturn(user);
        
        Attendence attendance = new Attendence();
        attendance.setId(1L);
        attendance.setStudent(student);
        attendance.setCourseClass(courseClass);
        attendance.setRecordedByUser(user);
        attendance.setStatus(AttendanceStatus.PRESENT);
        
        when(attendanceRepository.save(any(Attendence.class))).thenReturn(attendance);
        when(mapper.map(any(Attendence.class), eq(AttendanceResponse.class))).thenReturn(new AttendanceResponse());

        AttendanceResponse result = service.create(request, "testuser");

        assertThat(result).isNotNull();
    }

    @Test
    void saveBatchUpdatesExistingAttendance() {
        AttendanceCreateRequest request = buildRequest();
        Student student = new Student();
        student.setId(1L);
        student.setStatus(StudentStatus.ACTIVE);
        
        CourseClass courseClass = new CourseClass();
        courseClass.setId(1L);
        courseClass.setStartDate(LocalDate.now().minusDays(1));
        
        Users user = new Users();
        user.setId(1L);
        user.setUsername("testuser");

        Attendence existingAttendance = new Attendence();
        existingAttendance.setId(10L);
        existingAttendance.setStudent(student);
        existingAttendance.setCourseClass(courseClass);
        existingAttendance.setStatus(AttendanceStatus.ABSENT);

        when(courseClassRepository.findById(1L)).thenReturn(Optional.of(courseClass));
        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.existsByStudentIdAndCourseClassIdAndStatus(1L, 1L, EnrollmentStatus.ACTIVE)).thenReturn(true);
        when(attendanceRepository.findByCourseClassIdAndStudentIdAndAttendanceDate(1L, 1L, LocalDate.now()))
                .thenReturn(Optional.of(existingAttendance));
        when(authService.findActiveUserByUsername("testuser")).thenReturn(user);
        when(attendanceRepository.save(any(Attendence.class))).thenReturn(existingAttendance);
        when(mapper.map(any(Attendence.class), eq(AttendanceResponse.class))).thenReturn(new AttendanceResponse());

        AttendanceResponse result = service.create(request, "testuser");

        assertThat(result).isNotNull();
        assertThat(existingAttendance.getStatus()).isEqualTo(AttendanceStatus.PRESENT);
    }

    // ==================== helpers ====================

    private AttendanceCreateRequest buildRequest() {
        AttendanceCreateRequest req = new AttendanceCreateRequest();
        req.setCourseClassId(1L);
        req.setStudentId(1L);
        req.setAttendanceDate(LocalDate.now());
        req.setStatus(AttendanceStatus.PRESENT);
        return req;
    }
}
