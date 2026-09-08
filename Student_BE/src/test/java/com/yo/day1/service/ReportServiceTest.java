package com.yo.day1.service;

import com.yo.day1.dto.report.DashboardStatsResponseDto;
import com.yo.day1.dto.report.StudentStatusSummaryDto;
import com.yo.day1.repository.*;
import com.yo.day1.service.impl.ReportServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ReportServiceTest {

    @Mock
    private TuitionInvoiceRepository invoiceRepository;
    @Mock
    private AttendanceRepository attendanceRepository;
    @Mock
    private LearningResultRepository learningResultRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private TeacherRepository teacherRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private CourseClassRepository courseClassRepository;
    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private ReportServiceImpl service;

    // ==================== studentStatusSummary ====================

    @Test
    void studentStatusSummaryReturnsData() {
        when(studentRepository.countAll()).thenReturn(100L);
        when(studentRepository.countByStatus(any())).thenReturn(25L); // Mocking for ACTIVE, PAUSED, DROPPED

        StudentStatusSummaryDto result = service.studentStatusSummary();

        assertThat(result).isNotNull();
        assertThat(result.getTotalStudents()).isEqualTo(100L);
    }

    // ==================== getDashboardStats ====================

    @Test
    void getDashboardStatsReturnsData() {
        when(studentRepository.countAll()).thenReturn(100L);
        when(teacherRepository.count()).thenReturn(10L);
        when(teacherRepository.findByIsActive(true)).thenReturn(Collections.emptyList());
        when(courseClassRepository.count()).thenReturn(5L);
        when(courseClassRepository.findAll()).thenReturn(Collections.emptyList());
        when(courseRepository.count()).thenReturn(3L);
        when(paymentRepository.sumPaidAmountByMonth(anyInt(), anyInt())).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.sumAllPaidAmount()).thenReturn(BigDecimal.ZERO);
        when(invoiceRepository.countUnpaidInvoices()).thenReturn(2L);

        DashboardStatsResponseDto result = service.getDashboardStats();

        assertThat(result).isNotNull();
        assertThat(result.getTotalStudents()).isEqualTo(100L);
        assertThat(result.getTotalTeachers()).isEqualTo(10L);
    }
}
