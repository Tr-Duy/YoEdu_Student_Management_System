package com.yo.day1.service.impl;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.entity.Enrollment;
import com.yo.day1.domain.entity.Student;
import com.yo.day1.domain.enums.ClassStatus;
import com.yo.day1.domain.enums.EnrollmentStatus;
import com.yo.day1.dto.enrollment.EnrollmentCreateRequest;
import com.yo.day1.dto.enrollment.EnrollmentResponse;
import com.yo.day1.dto.enrollment.TransferRequest;
import com.yo.day1.repository.CourseClassRepository;
import com.yo.day1.repository.EnrollmentRepository;
import com.yo.day1.service.CourseClassService;
import com.yo.day1.service.EnrollmentService;
import com.yo.day1.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseClassRepository courseClassRepository;
    private final StudentService studentService;
    private final CourseClassService courseClassService;
    private final ModelMapper mapper;

    @Transactional
    @Override
    public EnrollmentResponse create(EnrollmentCreateRequest request) throws BadRequestException, NotFoundExeception {
        if (enrollmentRepository.existsByStudentIdAndCourseClassIdAndStatus(
                request.getStudentId(), request.getCourseClassId(), EnrollmentStatus.ACTIVE)) {
            throw new BadRequestException("Student is already enrolled in this class");
        }

        CourseClass courseClass = courseClassService.getCourseClass(request.getCourseClassId());

        if (courseClass.getStatus() == ClassStatus.CLOSED) {
            throw new BadRequestException("Lớp học đã đóng, không thể đăng ký");
        }
        if (courseClass.getStatus() == ClassStatus.FULL) {
            throw new BadRequestException("Lớp học đã đầy, không thể đăng ký");
        }

        long activeCount = enrollmentRepository.countByCourseClassIdAndStatus(
                request.getCourseClassId(), EnrollmentStatus.ACTIVE);
        if (activeCount >= courseClass.getMaxStudents()) {
            throw new BadRequestException("Class is full");
        }

        if (enrollmentRepository.hasScheduleConflict(
                request.getStudentId(), courseClass.getScheduleSlot().getId(), request.getCourseClassId())) {
            throw new BadRequestException("Học viên đã có lớp học vào khung giờ này (trùng lịch)");
        }

        Student student = studentService.getStudent(request.getStudentId());
        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourseClass(courseClass);
        enrollment.setEnrolledAt(request.getEnrolledAt());
        enrollment.setStatus(request.getStatus());
        enrollment.setNote(request.getNote());
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

        CourseClass toClass = courseClassService.getCourseClass(request.toClassId());

        if (toClass.getStatus() == ClassStatus.CLOSED) {
            throw new BadRequestException("Lớp đích đã đóng");
        }
        if (toClass.getStatus() == ClassStatus.FULL) {
            throw new BadRequestException("Lớp đích đã đầy");
        }
        if (enrollmentRepository.existsByStudentIdAndCourseClassIdAndStatus(
                request.studentId(), request.toClassId(), EnrollmentStatus.ACTIVE)) {
            throw new BadRequestException("Học viên đã có trong lớp đích");
        }

        if (enrollmentRepository.hasScheduleConflict(
                request.studentId(), toClass.getScheduleSlot().getId(), request.fromClassId())) {
            throw new BadRequestException("Lớp đích trùng lịch với lớp khác của học viên");
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

        Enrollment newEnrollment = new Enrollment();
        newEnrollment.setStudent(current.getStudent());
        newEnrollment.setCourseClass(toClass);
        newEnrollment.setStatus(EnrollmentStatus.ACTIVE);
        newEnrollment.setEnrolledAt(request.effectiveDate() != null ? request.effectiveDate() : LocalDate.now());
        newEnrollment.setNote("Chuyển từ lớp " + fromClass.getClassCode()
                + (request.reason() != null ? " - " + request.reason() : ""));
        Enrollment saved = enrollmentRepository.save(newEnrollment);

        long activeCount = enrollmentRepository.countByCourseClassIdAndStatus(
                request.toClassId(), EnrollmentStatus.ACTIVE);
        if (activeCount >= toClass.getMaxStudents()) {
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
