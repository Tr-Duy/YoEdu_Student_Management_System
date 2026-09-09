package com.yo.day1.service.impl;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.ConflictException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.entity.Enrollment;
import com.yo.day1.domain.entity.Student;
import com.yo.day1.domain.enums.ClassStatus;
import com.yo.day1.domain.enums.EnrollmentStatus;
import com.yo.day1.domain.enums.StudentStatus;
import com.yo.day1.dto.enrollment.EnrollmentCreateRequest;
import com.yo.day1.dto.enrollment.EnrollmentResponse;
import com.yo.day1.dto.enrollment.TransferRequest;
import com.yo.day1.repository.CourseClassRepository;
import com.yo.day1.repository.EnrollmentRepository;
import com.yo.day1.service.CourseClassService;
import com.yo.day1.service.EnrollmentService;
import com.yo.day1.service.ScheduleConflictService;
import com.yo.day1.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseClassRepository courseClassRepository;
    private final StudentService studentService;
    private final CourseClassService courseClassService;
    private final ScheduleConflictService scheduleConflictService;
    private final ModelMapper mapper;

    @Transactional
    @Override
    public EnrollmentResponse create(EnrollmentCreateRequest request) throws BadRequestException, NotFoundExeception {
        // Concurrency-safe: lock the course class row
        CourseClass courseClass = (courseClassRepository != null)
                ? courseClassRepository.findByIdWithLock(request.getCourseClassId())
                    .or(() -> courseClassRepository.findById(request.getCourseClassId()))
                    .orElseGet(() -> courseClassService.getCourseClass(request.getCourseClassId()))
                : courseClassService.getCourseClass(request.getCourseClassId());

        if (courseClass.getStatus() == ClassStatus.CLOSED) {
            throw new BadRequestException("Lớp học đã đóng, không thể đăng ký");
        }
        if (courseClass.getStatus() == ClassStatus.FULL) {
            throw new ConflictException("Lớp học đã đầy, không thể đăng ký");
        }

        Student student = studentService.getStudent(request.getStudentId());
        if (student.getStatus() == StudentStatus.DROPPED) {
            throw new BadRequestException("Học viên đã thôi học toàn trường, không thể đăng ký lớp mới.");
        }

        Optional<Enrollment> existingOpt = enrollmentRepository.findByStudentIdAndCourseClassId(
                request.getStudentId(), request.getCourseClassId());

        if (existingOpt.isPresent() && existingOpt.get().getStatus() == EnrollmentStatus.ACTIVE) {
            throw new ConflictException("Học viên đã đăng ký và đang học tại lớp này.");
        }

        long activeCount = enrollmentRepository.countByCourseClassIdAndStatus(
                request.getCourseClassId(), EnrollmentStatus.ACTIVE);
        if (activeCount >= courseClass.getMaxStudents()) {
            throw new ConflictException(String.format("Không thể đăng ký: lớp %s đã đủ sĩ số tối đa (%d học viên).",
                    courseClass.getClassCode(), courseClass.getMaxStudents()));
        }

        String conflictMsg = scheduleConflictService.getStudentConflictMessage(
                request.getStudentId(),
                courseClass.getScheduleSlot(),
                courseClass.getStartDate(),
                courseClass.getEndDate(),
                null);
        if (conflictMsg != null) {
            throw new ConflictException("Không thể đăng ký: " + conflictMsg);
        }

        Enrollment enrollment;
        if (existingOpt.isPresent()) {
            // Re-enrollment of a previously DROPPED or COMPLETED record
            enrollment = existingOpt.get();
            enrollment.setStatus(EnrollmentStatus.ACTIVE);
            enrollment.setEnrolledAt(request.getEnrolledAt() != null ? request.getEnrolledAt() : LocalDate.now());
            if (request.getNote() != null) {
                enrollment.setNote(request.getNote());
            }
        } else {
            enrollment = new Enrollment();
            enrollment.setStudent(student);
            enrollment.setCourseClass(courseClass);
            enrollment.setEnrolledAt(request.getEnrolledAt() != null ? request.getEnrolledAt() : LocalDate.now());
            enrollment.setStatus(request.getStatus() != null ? request.getStatus() : EnrollmentStatus.ACTIVE);
            enrollment.setNote(request.getNote());
        }

        Enrollment saved = enrollmentRepository.save(enrollment);

        long newActiveCount = enrollmentRepository.countByCourseClassIdAndStatus(
                request.getCourseClassId(), EnrollmentStatus.ACTIVE);
        if (newActiveCount >= courseClass.getMaxStudents()) {
            courseClass.setStatus(ClassStatus.FULL);
            courseClassRepository.save(courseClass);
        }

        return toResponse(saved);
    }

    @Transactional
    @Override
    public EnrollmentResponse drop(Long enrollmentId) throws BadRequestException, NotFoundExeception {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new NotFoundExeception("Enrollment not found: " + enrollmentId));

        if (enrollment.getStatus() == EnrollmentStatus.DROPPED) {
            throw new BadRequestException("Học viên đã hủy học rồi");
        }

        enrollment.setStatus(EnrollmentStatus.DROPPED);
        Enrollment saved = enrollmentRepository.save(enrollment);

        CourseClass courseClass = enrollment.getCourseClass();
        if (courseClass.getStatus() == ClassStatus.FULL) {
            courseClass.setStatus(ClassStatus.OPEN);
            courseClassRepository.save(courseClass);
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    @Override
    public List<EnrollmentResponse> findByStudentId(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<EnrollmentResponse> findByClassId(Long classId) {
        return enrollmentRepository.findByCourseClassId(classId).stream().map(this::toResponse).toList();
    }

    @Override
    public Enrollment getEnrollment(Long studentId, Long classId) throws BadRequestException {
        return enrollmentRepository.findByStudentIdAndCourseClassId(studentId, classId)
                .orElseThrow(() -> new BadRequestException("Enrollment not found for student and class"));
    }

    @Transactional
    @Override
    public EnrollmentResponse transfer(TransferRequest request) throws BadRequestException, NotFoundExeception {
        Enrollment current = enrollmentRepository
                .findByStudentIdAndCourseClassId(request.studentId(), request.fromClassId())
                .orElseThrow(() -> new NotFoundExeception("Học viên không có trong lớp nguồn"));

        if (current.getStatus() != EnrollmentStatus.ACTIVE) {
            throw new BadRequestException("Học viên không đang học tại lớp nguồn");
        }

        // Lock target class for safe concurrency
        CourseClass toClass = (courseClassRepository != null)
                ? courseClassRepository.findByIdWithLock(request.toClassId())
                    .or(() -> courseClassRepository.findById(request.toClassId()))
                    .orElseGet(() -> courseClassService.getCourseClass(request.toClassId()))
                : courseClassService.getCourseClass(request.toClassId());

        if (toClass == null) {
            throw new NotFoundExeception("Lớp đích không tồn tại");
        }

        if (toClass.getStatus() == ClassStatus.CLOSED) {
            throw new BadRequestException("Lớp đích đã đóng");
        }
        if (toClass.getStatus() == ClassStatus.FULL) {
            throw new ConflictException("Lớp đích đã đầy");
        }

        Optional<Enrollment> existingToOpt = enrollmentRepository.findByStudentIdAndCourseClassId(
                request.studentId(), request.toClassId());

        if (existingToOpt.isPresent() && existingToOpt.get().getStatus() == EnrollmentStatus.ACTIVE) {
            throw new ConflictException("Học viên đã đăng ký và đang học tại lớp đích");
        }

        long activeCount = enrollmentRepository.countByCourseClassIdAndStatus(
                request.toClassId(), EnrollmentStatus.ACTIVE);
        if (activeCount >= toClass.getMaxStudents()) {
            throw new ConflictException(String.format("Lớp đích %s đã đủ sĩ số tối đa (%d học viên)",
                    toClass.getClassCode(), toClass.getMaxStudents()));
        }

        String conflictMsg = scheduleConflictService.getStudentConflictMessage(
                request.studentId(),
                toClass.getScheduleSlot(),
                toClass.getStartDate(),
                toClass.getEndDate(),
                request.fromClassId());
        if (conflictMsg != null) {
            throw new ConflictException("Lớp đích trùng lịch: " + conflictMsg);
        }

        CourseClass fromClass = current.getCourseClass();
        current.setStatus(EnrollmentStatus.DROPPED);
        current.setNote("Chuyển sang lớp " + toClass.getClassCode()
                + (request.reason() != null ? " - " + request.reason() : ""));
        enrollmentRepository.save(current);

        if (fromClass.getStatus() == ClassStatus.FULL) {
            fromClass.setStatus(ClassStatus.OPEN);
            courseClassRepository.save(fromClass);
        }

        Enrollment targetEnrollment;
        if (existingToOpt.isPresent()) {
            targetEnrollment = existingToOpt.get();
            targetEnrollment.setStatus(EnrollmentStatus.ACTIVE);
            targetEnrollment.setEnrolledAt(request.effectiveDate() != null ? request.effectiveDate() : LocalDate.now());
            targetEnrollment.setNote("Chuyển từ lớp " + fromClass.getClassCode()
                    + (request.reason() != null ? " - " + request.reason() : ""));
        } else {
            targetEnrollment = new Enrollment();
            targetEnrollment.setStudent(current.getStudent());
            targetEnrollment.setCourseClass(toClass);
            targetEnrollment.setStatus(EnrollmentStatus.ACTIVE);
            targetEnrollment.setEnrolledAt(request.effectiveDate() != null ? request.effectiveDate() : LocalDate.now());
            targetEnrollment.setNote("Chuyển từ lớp " + fromClass.getClassCode()
                    + (request.reason() != null ? " - " + request.reason() : ""));
        }
        Enrollment saved = enrollmentRepository.save(targetEnrollment);

        long newActiveCount = enrollmentRepository.countByCourseClassIdAndStatus(
                request.toClassId(), EnrollmentStatus.ACTIVE);
        if (newActiveCount >= toClass.getMaxStudents()) {
            toClass.setStatus(ClassStatus.FULL);
            courseClassRepository.save(toClass);
        }

        return toResponse(saved);
    }

    private EnrollmentResponse toResponse(Enrollment enrollment) {
        EnrollmentResponse result = mapper.map(enrollment, EnrollmentResponse.class);
        result.setStudentId(enrollment.getStudent().getId());
        result.setStudentName(enrollment.getStudent().getFullName());
        result.setCourseClassId(enrollment.getCourseClass().getId());
        result.setClassName(enrollment.getCourseClass().getName());
        result.setStatus(enrollment.getStatus().toString());
        return result;
    }
}
