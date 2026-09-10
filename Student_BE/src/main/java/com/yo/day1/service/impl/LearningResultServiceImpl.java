package com.yo.day1.service.impl;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.ConflictException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.LearningResult;
import com.yo.day1.domain.entity.Users;
import com.yo.day1.domain.enums.GradeClassification;
import com.yo.day1.domain.enums.GradeStatus;
import com.yo.day1.dto.learning.LearningResultCreateRequest;
import com.yo.day1.dto.learning.LearningResultResponse;
import com.yo.day1.dto.learning.LearningResultUpdateRequest;
import com.yo.day1.dto.learning.LearningResultSearchRequest;
import com.yo.day1.repository.LearningResultRepository;
import com.yo.day1.repository.EnrollmentRepository;
import com.yo.day1.repository.AttendanceRepository;
import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.service.AuthService;
import com.yo.day1.service.CourseClassService;
import com.yo.day1.service.LearningResultService;
import com.yo.day1.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class LearningResultServiceImpl implements LearningResultService {
    private final LearningResultRepository learningResultRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final StudentService studentService;
    private final CourseClassService courseClassService;
    private final AuthService authService;
    private final ModelMapper mapper;

    @Transactional
    @Override
    public LearningResultResponse create(LearningResultCreateRequest request, String username) {
        if (learningResultRepository.existsByStudentIdAndCourseClassIdAndResultMonth(
                request.getStudentId(), request.getCourseClassId(), request.getResultMonth())) {
            throw new ConflictException("Learning result already exists for this student, class, and month");
        }
        
        CourseClass courseClass = courseClassService.getCourseClass(request.getCourseClassId());
        
        // 9. STUDENT MUST BE ENROLLED
        boolean isEnrolled = enrollmentRepository.existsByStudentIdAndCourseClassIdAndStatus(
                request.getStudentId(), request.getCourseClassId(), com.yo.day1.domain.enums.EnrollmentStatus.ACTIVE);
        if (!isEnrolled) {
            throw new BadRequestException("Student is not actively enrolled in this class");
        }

        Users user = authService.findActiveUserByUsername(username);
        
        // 12. TEACHER AUTHORIZATION
        if (user.getRole() == com.yo.day1.domain.enums.UserRole.ACADEMIC_STAFF) {
            if (user.getTeacher() == null) {
                // If it's just academic staff without a teacher profile, they might have global access, 
                // but let's assume they must be the teacher if we enforce it. 
                // Actually, ACADEMIC_STAFF might be able to edit any class.
            } else {
                if (!courseClass.getMainTeacher().getId().equals(user.getTeacher().getId()) && 
                    (courseClass.getAssistantTeacher() == null || !courseClass.getAssistantTeacher().getId().equals(user.getTeacher().getId()))) {
                    throw new com.yo.day1.common.exception.BadRequestException("Teacher is not assigned to this class");
                }
            }
        }

        LearningResult item = new LearningResult();
        item.setStudent(studentService.getStudent(request.getStudentId()));
        item.setCourseClass(courseClass);
        item.setResultMonth(request.getResultMonth());
        item.setScore(request.getScore());
        item.setTeacherComment(request.getTeacherComment());
        item.setClassification(calculateClassification(request.getScore()));
        item.setStatus(GradeStatus.DRAFT);
        item.setCreatedByUser(user);
        try {
            return toResponse(learningResultRepository.saveAndFlush(item));
        } catch (DataIntegrityViolationException ex) {
            if (isDuplicateLearningResult(ex)) {
                throw new ConflictException("Learning result already exists for this student, class, and month");
            }
            throw ex;
        }
    }

    @Transactional
    @Override
    public LearningResultResponse update(Long id, LearningResultUpdateRequest request, String username) {
        LearningResult item = learningResultRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Learning result not found: " + id));
                
        Users user = authService.findActiveUserByUsername(username);
        
        // 18. UPDATE GRADE - Check status
        if (item.getStatus() == GradeStatus.LOCKED && user.getRole() != com.yo.day1.domain.enums.UserRole.ADMIN) {
            throw new com.yo.day1.common.exception.BadRequestException("Cannot update a LOCKED learning result");
        }
        
        // 12. TEACHER AUTHORIZATION
        if (user.getRole() == com.yo.day1.domain.enums.UserRole.ACADEMIC_STAFF) {
            if (user.getTeacher() != null) {
                CourseClass courseClass = item.getCourseClass();
                if (!courseClass.getMainTeacher().getId().equals(user.getTeacher().getId()) && 
                    (courseClass.getAssistantTeacher() == null || !courseClass.getAssistantTeacher().getId().equals(user.getTeacher().getId()))) {
                    throw new com.yo.day1.common.exception.BadRequestException("Teacher is not assigned to this class");
                }
            }
        }
        
        if (request.getScore() != null) {
            item.setScore(request.getScore());
            item.setClassification(calculateClassification(request.getScore()));
        }
        if (request.getTeacherComment() != null) item.setTeacherComment(request.getTeacherComment());
        item.setCreatedByUser(user);
        return toResponse(learningResultRepository.save(item));
    }

    @Transactional(readOnly = true)
    @Override
    public List<LearningResultResponse> findByClassAndMonth(Long courseClassId, int year, int month) {
        return learningResultRepository.findByClassAndMonth(courseClassId, year, month)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<LearningResultResponse> findByStudentId(Long studentId, String username) throws BadRequestException, NotFoundExeception {
        Users user = authService.findActiveUserByUsername(username);
        if (user.getRole().name().equals("PARENT")) {
            studentService.getStudentForParent(studentId, user.getParent().getId());
        }
        return learningResultRepository.findByStudentId(studentId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<LearningResultResponse> search(LearningResultSearchRequest request, String username) {
        Users user = authService.findActiveUserByUsername(username);
        Long searchTeacherId = request.getTeacherId();
        
        // 12. TEACHER AUTHORIZATION - if user is teacher, they can only search their own classes
        if (user.getRole() == com.yo.day1.domain.enums.UserRole.ACADEMIC_STAFF) {
            if (user.getTeacher() != null) {
                searchTeacherId = user.getTeacher().getId();
            }
        }
        
        Integer year = null;
        Integer month = null;
        if (request.getMonth() != null && request.getMonth().matches("\\d{4}-\\d{2}")) {
            String[] parts = request.getMonth().split("-");
            year = Integer.parseInt(parts[0]);
            month = Integer.parseInt(parts[1]);
        }
        
        List<LearningResult> results = learningResultRepository.searchLearningResults(
                request.getStudentName(),
                request.getCourseClassId(),
                request.getCourseId(),
                searchTeacherId,
                year,
                month,
                request.getClassification(),
                request.getStatus()
        );
        
        return results.stream().map(this::toResponse).toList();
    }

    @Transactional
    @Override
    public void delete(Long id, String username) {
        LearningResult item = learningResultRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Learning result not found: " + id));
        Users user = authService.findActiveUserByUsername(username);
        
        if (item.getStatus() == GradeStatus.LOCKED) {
            throw new com.yo.day1.common.exception.BadRequestException("Cannot delete a LOCKED learning result");
        }
        
        if (user.getRole() == com.yo.day1.domain.enums.UserRole.ACADEMIC_STAFF && user.getTeacher() != null) {
            CourseClass courseClass = item.getCourseClass();
            if (!courseClass.getMainTeacher().getId().equals(user.getTeacher().getId()) && 
                (courseClass.getAssistantTeacher() == null || !courseClass.getAssistantTeacher().getId().equals(user.getTeacher().getId()))) {
                throw new com.yo.day1.common.exception.BadRequestException("Teacher is not assigned to this class");
            }
        }
        
        learningResultRepository.delete(item);
    }

    @Transactional
    @Override
    public void lock(Long id, String username) {
        LearningResult item = learningResultRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Learning result not found: " + id));
        Users user = authService.findActiveUserByUsername(username);
        
        if (user.getRole() == com.yo.day1.domain.enums.UserRole.ACADEMIC_STAFF && user.getTeacher() != null) {
            CourseClass courseClass = item.getCourseClass();
            if (!courseClass.getMainTeacher().getId().equals(user.getTeacher().getId()) && 
                (courseClass.getAssistantTeacher() == null || !courseClass.getAssistantTeacher().getId().equals(user.getTeacher().getId()))) {
                throw new com.yo.day1.common.exception.BadRequestException("Teacher is not assigned to this class");
            }
        }
        
        item.setStatus(GradeStatus.LOCKED);
        learningResultRepository.save(item);
    }

    @Transactional
    @Override
    public void unlock(Long id, String username) {
        LearningResult item = learningResultRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Learning result not found: " + id));
        Users user = authService.findActiveUserByUsername(username);
        
        if (user.getRole() != com.yo.day1.domain.enums.UserRole.ADMIN) {
            throw new com.yo.day1.common.exception.BadRequestException("Only ADMIN can unlock learning results");
        }
        
        item.setStatus(GradeStatus.DRAFT);
        learningResultRepository.save(item);
    }

    private LearningResultResponse toResponse(LearningResult item) {
        LearningResultResponse response = mapper.map(item, LearningResultResponse.class);
        response.setStudentId(item.getStudent().getId());
        response.setStudentName(item.getStudent().getFullName());
        response.setCourseClassId(item.getCourseClass().getId());
        response.setClassName(item.getCourseClass().getName());
        response.setCreatedByUserId(item.getCreatedByUser().getId());
        response.setCreatedByUsername(item.getCreatedByUser().getUsername());
        response.setClassification(item.getClassification());
        response.setStatus(item.getStatus());
        
        // 7. ATTENDANCE RATE PHẢI THEO THÁNG
        Double rate = attendanceRepository.calculateAttendanceRate(
                item.getStudent().getId(), 
                item.getCourseClass().getId(), 
                item.getResultMonth().getYear(), 
                item.getResultMonth().getMonthValue());
        response.setAttendanceRate(rate);
        
        return response;
    }

    private boolean isDuplicateLearningResult(DataIntegrityViolationException ex) {
        Throwable cause = ex.getMostSpecificCause();
        String message = cause != null ? cause.getMessage() : ex.getMessage();
        return message != null && message.toLowerCase(Locale.ROOT).contains("uq_learning_result");
    }

    private GradeClassification calculateClassification(java.math.BigDecimal score) {
        if (score == null) return null;
        double s = score.doubleValue();
        if (s >= 9.0) return GradeClassification.XUAT_SAC;
        if (s >= 8.0) return GradeClassification.GIOI;
        if (s >= 6.5) return GradeClassification.KHA;
        if (s >= 5.0) return GradeClassification.TRUNG_BINH;
        return GradeClassification.YEU;
    }
}
