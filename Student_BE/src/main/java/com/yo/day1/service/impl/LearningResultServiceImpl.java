package com.yo.day1.service.impl;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.ConflictException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.CourseClass;
import com.yo.day1.domain.entity.LearningResult;
import com.yo.day1.domain.entity.Student;
import com.yo.day1.domain.entity.Users;
import com.yo.day1.domain.enums.EnrollmentStatus;
import com.yo.day1.domain.enums.GradeClassification;
import com.yo.day1.domain.enums.GradeStatus;
import com.yo.day1.domain.enums.UserRole;
import com.yo.day1.dto.learning.LearningResultCreateRequest;
import com.yo.day1.dto.learning.LearningResultResponse;
import com.yo.day1.dto.learning.LearningResultSearchRequest;
import com.yo.day1.dto.learning.LearningResultUpdateRequest;
import com.yo.day1.repository.AttendanceRepository;
import com.yo.day1.repository.EnrollmentRepository;
import com.yo.day1.repository.LearningResultRepository;
import com.yo.day1.service.AuthService;
import com.yo.day1.service.CourseClassService;
import com.yo.day1.service.LearningResultService;
import com.yo.day1.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
        // 1. Kiểm tra duplicate học viên + lớp
        if (learningResultRepository.existsByStudentIdAndCourseClassId(
                request.getStudentId(), request.getCourseClassId())) {
            throw new ConflictException("Học viên này đã có bảng điểm trong lớp.");
        }

        // 2. Kiểm tra tồn tại CourseClass và Student
        CourseClass courseClass = courseClassService.getCourseClass(request.getCourseClassId());
        Student student = studentService.getStudent(request.getStudentId());

        // 3. Học viên bắt buộc phải enrolled trong lớp
        boolean isEnrolled = enrollmentRepository.existsByStudentIdAndCourseClassIdAndStatus(
                request.getStudentId(), request.getCourseClassId(), EnrollmentStatus.ACTIVE);
        if (!isEnrolled) {
            throw new BadRequestException("Học viên chưa đăng ký lớp học này");
        }

        Users user = authService.findActiveUserByUsername(username);

        // 4. Kiểm tra phân quyền giáo viên
        if (user.getRole() == UserRole.ACADEMIC_STAFF && user.getTeacher() != null) {
            Long teacherId = user.getTeacher().getId();
            boolean isMainTeacher = courseClass.getMainTeacher() != null && courseClass.getMainTeacher().getId().equals(teacherId);
            boolean isAssistant = courseClass.getAssistantTeacher() != null && courseClass.getAssistantTeacher().getId().equals(teacherId);
            if (!isMainTeacher && !isAssistant) {
                throw new BadRequestException("Teacher is not assigned to this class");
            }
        }

        // 5. Tính toán tổng điểm và xếp loại
        Integer totalScore = calculateTotalScore(request.getProcessScore(), request.getMidtermScore(), request.getFinalScore());
        GradeClassification classification = calculateClassification(totalScore);

        LearningResult item = new LearningResult();
        item.setStudent(student);
        item.setCourseClass(courseClass);
        item.setProcessScore(request.getProcessScore());
        item.setMidtermScore(request.getMidtermScore());
        item.setFinalScore(request.getFinalScore());
        item.setTotalScore(totalScore);
        item.setClassification(classification);
        item.setStatus(GradeStatus.DRAFT);
        item.setTeacherComment(request.getTeacherComment());
        item.setCreatedByUser(user);

        try {
            return toResponse(learningResultRepository.saveAndFlush(item));
        } catch (DataIntegrityViolationException ex) {
            if (isDuplicateLearningResult(ex)) {
                throw new ConflictException("Học viên này đã có bảng điểm trong lớp.");
            }
            throw ex;
        }
    }

    @Transactional
    @Override
    public LearningResultResponse update(Long id, LearningResultUpdateRequest request, String username) {
        LearningResult item = learningResultRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Learning result not found: " + id));

        // 1. Kiểm tra trạng thái LOCKED: Không cho sửa, trả về 409 Conflict
        if (item.getStatus() == GradeStatus.LOCKED) {
            throw new ConflictException("Điểm đã khóa và không thể chỉnh sửa.");
        }

        Users user = authService.findActiveUserByUsername(username);

        // 2. Phân quyền giáo viên
        if (user.getRole() == UserRole.ACADEMIC_STAFF && user.getTeacher() != null) {
            CourseClass courseClass = item.getCourseClass();
            Long teacherId = user.getTeacher().getId();
            boolean isMainTeacher = courseClass.getMainTeacher() != null && courseClass.getMainTeacher().getId().equals(teacherId);
            boolean isAssistant = courseClass.getAssistantTeacher() != null && courseClass.getAssistantTeacher().getId().equals(teacherId);
            if (!isMainTeacher && !isAssistant) {
                throw new BadRequestException("Teacher is not assigned to this class");
            }
        }

        // 3. Cập nhật các điểm thành phần
        item.setProcessScore(request.getProcessScore());
        item.setMidtermScore(request.getMidtermScore());
        item.setFinalScore(request.getFinalScore());
        if (request.getTeacherComment() != null) {
            item.setTeacherComment(request.getTeacherComment());
        }

        // 4. Tính toán lại tổng điểm và xếp loại
        Integer totalScore = calculateTotalScore(item.getProcessScore(), item.getMidtermScore(), item.getFinalScore());
        item.setTotalScore(totalScore);
        item.setClassification(calculateClassification(totalScore));

        return toResponse(learningResultRepository.save(item));
    }

    @Transactional(readOnly = true)
    @Override
    public List<LearningResultResponse> findByClassId(Long courseClassId) {
        return learningResultRepository.findByCourseClassId(courseClassId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<LearningResultResponse> findByStudentId(Long studentId, String username) throws BadRequestException, NotFoundExeception {
        Users user = authService.findActiveUserByUsername(username);
        if (user.getRole() == UserRole.PARENT && user.getParent() != null) {
            studentService.getStudentForParent(studentId, user.getParent().getId());
        }
        return learningResultRepository.findByStudentId(studentId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<LearningResultResponse> search(LearningResultSearchRequest request, String username) {
        Users user = authService.findActiveUserByUsername(username);
        Long searchTeacherId = request.getTeacherId();

        if (user.getRole() == UserRole.ACADEMIC_STAFF && user.getTeacher() != null) {
            searchTeacherId = user.getTeacher().getId();
        }

        List<LearningResult> results = learningResultRepository.searchLearningResults(
                request.getStudentName(),
                request.getCourseClassId(),
                request.getCourseId(),
                searchTeacherId,
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

        // Kiểm tra LOCKED: Không cho xóa, trả 409 Conflict
        if (item.getStatus() == GradeStatus.LOCKED) {
            throw new ConflictException("Điểm đã khóa và không thể xóa.");
        }

        Users user = authService.findActiveUserByUsername(username);
        if (user.getRole() == UserRole.ACADEMIC_STAFF && user.getTeacher() != null) {
            CourseClass courseClass = item.getCourseClass();
            Long teacherId = user.getTeacher().getId();
            boolean isMainTeacher = courseClass.getMainTeacher() != null && courseClass.getMainTeacher().getId().equals(teacherId);
            boolean isAssistant = courseClass.getAssistantTeacher() != null && courseClass.getAssistantTeacher().getId().equals(teacherId);
            if (!isMainTeacher && !isAssistant) {
                throw new BadRequestException("Teacher is not assigned to this class");
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

        if (user.getRole() == UserRole.ACADEMIC_STAFF && user.getTeacher() != null) {
            CourseClass courseClass = item.getCourseClass();
            Long teacherId = user.getTeacher().getId();
            boolean isMainTeacher = courseClass.getMainTeacher() != null && courseClass.getMainTeacher().getId().equals(teacherId);
            boolean isAssistant = courseClass.getAssistantTeacher() != null && courseClass.getAssistantTeacher().getId().equals(teacherId);
            if (!isMainTeacher && !isAssistant) {
                throw new BadRequestException("Teacher is not assigned to this class");
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

        if (user.getRole() != UserRole.ADMIN) {
            throw new BadRequestException("Chỉ ADMIN mới có quyền mở khóa bảng điểm");
        }

        item.setStatus(GradeStatus.DRAFT);
        learningResultRepository.save(item);
    }

    /**
     * Thuật toán tính tổng điểm duy nhất:
     * - TH1: Chỉ có midterm và final (process is null) -> (midterm + final) / 2
     * - TH2: Có đủ cả process, midterm, final -> process * 0.10 + midterm * 0.30 + final * 0.60
     * - TH3: Thiếu midterm hoặc final hoặc chỉ có process -> NULL
     * - Làm tròn số nguyên: phần thập phân < 0.5 làm tròn xuống, >= 0.5 làm tròn lên (HALF_UP)
     */
    public static Integer calculateTotalScore(BigDecimal process, BigDecimal midterm, BigDecimal finalExam) {
        if (midterm == null || finalExam == null) {
            return null; // Không tự coi điểm thiếu là 0
        }

        BigDecimal raw;
        if (process == null) {
            // TH1: Chỉ có midterm + final
            raw = midterm.add(finalExam).divide(BigDecimal.valueOf(2), 4, RoundingMode.HALF_UP);
        } else {
            // TH2: Có đủ cả 3 thành phần
            BigDecimal partProcess = process.multiply(BigDecimal.valueOf(0.10));
            BigDecimal partMidterm = midterm.multiply(BigDecimal.valueOf(0.30));
            BigDecimal partFinal = finalExam.multiply(BigDecimal.valueOf(0.60));
            raw = partProcess.add(partMidterm).add(partFinal);
        }

        int rounded = raw.setScale(0, RoundingMode.HALF_UP).intValue();
        return Math.max(0, Math.min(10, rounded));
    }

    /**
     * Thuật toán xếp loại duy nhất dựa trên total_score đã làm tròn:
     * - total <= 5: YẾU
     * - total > 5 && total < 7 (= 6): TRUNG BÌNH
     * - total >= 7 && total < 8 (= 7): KHÁ
     * - total >= 8 && total <= 10 (= 8, 9, 10): GIỎI
     */
    public static GradeClassification calculateClassification(Integer totalScore) {
        if (totalScore == null) {
            return null;
        }
        if (totalScore <= 5) {
            return GradeClassification.YEU;
        } else if (totalScore < 7) {
            return GradeClassification.TRUNG_BINH;
        } else if (totalScore < 8) {
            return GradeClassification.KHA;
        } else {
            return GradeClassification.GIOI;
        }
    }

    private LearningResultResponse toResponse(LearningResult item) {
        LearningResultResponse response = new LearningResultResponse();
        response.setId(item.getId());
        response.setStudentId(item.getStudent().getId());
        response.setStudentName(item.getStudent().getFullName());
        response.setStudentCode(item.getStudent().getStudentCode());
        response.setCourseClassId(item.getCourseClass().getId());
        response.setCourseClassName(item.getCourseClass().getName());
        response.setClassName(item.getCourseClass().getName());

        response.setProcessScore(item.getProcessScore());
        response.setMidtermScore(item.getMidtermScore());
        response.setFinalScore(item.getFinalScore());
        response.setTotalScore(item.getTotalScore());
        response.setClassification(item.getClassification());
        response.setStatus(item.getStatus());
        response.setTeacherComment(item.getTeacherComment());

        if (item.getCreatedByUser() != null) {
            response.setCreatedByUserId(item.getCreatedByUser().getId());
            response.setCreatedByUsername(item.getCreatedByUser().getUsername());
        }
        response.setCreatedAt(item.getCreatedAt());
        response.setUpdatedAt(item.getUpdatedAt());

        Double rate = attendanceRepository.calculateOverallAttendanceRate(
                item.getStudent().getId(),
                item.getCourseClass().getId());
        response.setAttendanceRate(rate);

        return response;
    }

    private boolean isDuplicateLearningResult(DataIntegrityViolationException ex) {
        Throwable cause = ex.getMostSpecificCause();
        String message = cause != null ? cause.getMessage() : ex.getMessage();
        return message != null && message.toLowerCase(Locale.ROOT).contains("uq_learning_result");
    }
}
