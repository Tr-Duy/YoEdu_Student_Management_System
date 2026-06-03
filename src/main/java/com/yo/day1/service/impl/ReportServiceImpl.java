package com.yo.day1.service.impl;

import com.yo.day1.domain.enums.StudentStatus;
import com.yo.day1.dto.report.*;
import com.yo.day1.repository.*;
import com.yo.day1.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final TuitionInvoiceRepository invoiceRepository;
    private final AttendanceRepository attendanceRepository;
    private final LearningResultRepository learningResultRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final TeacherRepository teacherRepository;
    private final CourseRepository courseRepository;
    private final CourseClassRepository courseClassRepository;
    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    @Override
    public List<RevenueByMonthDto> revenueByMonth(Integer year) {
        return invoiceRepository.revenueByMonth(year).stream().map(r -> new RevenueByMonthDto(
                ((Number) r[0]).intValue(),
                ((Number) r[1]).intValue(),
                toBD(r[2]), toBD(r[3]), toBD(r[4]),
                ((Number) r[5]).longValue(),
                ((Number) r[6]).longValue(),
                ((Number) r[7]).longValue()
        )).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<RevenueByClassDto> revenueByClass(Integer year, Integer month) {
        return invoiceRepository.revenueByClass(year, month).stream().map(r -> new RevenueByClassDto(
                ((Number) r[0]).longValue(),
                (String) r[1],
                toBD(r[2]), toBD(r[3]), toBD(r[4]),
                ((Number) r[5]).longValue()
        )).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<AttendanceSummaryDto> attendanceSummary(int year, int month, Long classId) {
        return attendanceRepository.attendanceSummary(year, month, classId).stream().map(r -> {
            long present = ((Number) r[2]).longValue();
            long absent  = ((Number) r[3]).longValue();
            long late    = ((Number) r[4]).longValue();
            long total   = ((Number) r[5]).longValue();
            double rate  = total == 0 ? 0 : BigDecimal.valueOf((present + late) * 100.0 / total)
                    .setScale(1, RoundingMode.HALF_UP).doubleValue();
            return new AttendanceSummaryDto(
                    ((Number) r[0]).longValue(), (String) r[1],
                    year, month, total, present, absent, late, rate);
        }).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<TopAbsentStudentDto> topAbsentStudents(Integer year, Integer month, int limit) {
        return attendanceRepository.topAbsentStudents(year, month).stream()
                .limit(limit)
                .map(r -> new TopAbsentStudentDto(
                        ((Number) r[0]).longValue(),
                        (String) r[1],
                        (String) r[2],
                        ((Number) r[3]).longValue()))
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<LearningResultSummaryDto> learningResultSummary(int year, int month, Long classId) {
        return learningResultRepository.learningResultSummary(year, month, classId).stream().map(r ->
                new LearningResultSummaryDto(
                        ((Number) r[0]).longValue(), (String) r[1],
                        year, month,
                        ((Number) r[2]).longValue(),
                        toBD(r[3]), toBD(r[4]), toBD(r[5]),
                        ((Number) r[6]).longValue(),
                        ((Number) r[7]).longValue(),
                        ((Number) r[8]).longValue(),
                        ((Number) r[9]).longValue())
        ).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public StudentStatusSummaryDto studentStatusSummary() {
        long total      = studentRepository.countAll();
        long active     = studentRepository.countByStatus(StudentStatus.ACTIVE);
        long pause      = studentRepository.countByStatus(StudentStatus.PAUSED);
        long dropped    = studentRepository.countByStatus(StudentStatus.DROPPED);
        return new StudentStatusSummaryDto(total, active, pause, dropped, 0L);
    }

    @Transactional(readOnly = true)
    @Override
    public List<ClassEnrollmentSummaryDto> classEnrollmentSummary() {
        return enrollmentRepository.classEnrollmentSummary().stream().map(r -> {
            int maxStudents = ((Number) r[4]).intValue();
            long enrolled   = ((Number) r[5]).longValue();
            double fillRate = maxStudents == 0 ? 0 : BigDecimal.valueOf(enrolled * 100.0 / maxStudents)
                    .setScale(1, RoundingMode.HALF_UP).doubleValue();
            return new ClassEnrollmentSummaryDto(
                    ((Number) r[0]).longValue(),
                    (String) r[1], (String) r[2],
                    r[3].toString(),
                    maxStudents, enrolled, fillRate);
        }).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public DashboardStatsResponseDto getDashboardStats() {
        long totalStudents = studentRepository.countAll();
        long activeStudents = studentRepository.countByStatus(StudentStatus.ACTIVE);
        long pausedStudents = studentRepository.countByStatus(StudentStatus.PAUSED);
        long droppedStudents = studentRepository.countByStatus(StudentStatus.DROPPED);

        long totalTeachers = teacherRepository.count();
        long activeTeachers = teacherRepository.findByIsActive(true).size();

        long totalClasses = courseClassRepository.count();
        long ongoingClasses = courseClassRepository.findAll().stream()
                .filter(c -> c.getStatus() != null && (c.getStatus().name().equals("ONGOING") || c.getStatus().name().equals("OPEN")))
                .count();

        long totalCourses = courseRepository.count();

        java.time.LocalDate now = java.time.LocalDate.now();
        BigDecimal monthlyRev = paymentRepository.sumPaidAmountByMonth(now.getYear(), now.getMonthValue());
        BigDecimal totalRev = paymentRepository.sumAllPaidAmount();

        long unpaidCount = invoiceRepository.countUnpaidInvoices();

        DashboardStatsResponseDto dto = new DashboardStatsResponseDto();
        dto.setTotalStudents(totalStudents);
        dto.setActiveStudents(activeStudents);
        dto.setPausedStudents(pausedStudents);
        dto.setDroppedStudents(droppedStudents);
        dto.setTotalTeachers(totalTeachers);
        dto.setActiveTeachers(activeTeachers);
        dto.setTotalClasses(totalClasses);
        dto.setOngoingClasses(ongoingClasses);
        dto.setTotalRevenue(totalRev);
        dto.setMonthlyRevenue(monthlyRev);

        // Direct requested aliases
        dto.setStudentsCount(activeStudents);
        dto.setCoursesCount(totalCourses);
        dto.setClassesCount(totalClasses);
        dto.setCurrentMonthRevenue(monthlyRev);
        dto.setUnpaidInvoicesCount(unpaidCount);

        return dto;
    }

    private BigDecimal toBD(Object val) {
        if (val == null) return BigDecimal.ZERO;
        if (val instanceof BigDecimal bd) return bd;
        return BigDecimal.valueOf(((Number) val).doubleValue());
    }
}
