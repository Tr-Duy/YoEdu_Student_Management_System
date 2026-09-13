package com.yo.day1.service.impl;

import com.yo.day1.common.exception.BadRequestException;
import com.yo.day1.common.exception.ConflictException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.Parent;
import com.yo.day1.domain.entity.Student;
import com.yo.day1.domain.entity.StudentStatusHistory;
import com.yo.day1.domain.enums.StudentStatus;
import com.yo.day1.domain.spec.StudentSpec;
import com.yo.day1.dto.student.ChangeStudentStatusRequest;
import com.yo.day1.dto.student.StudentResponse;
import com.yo.day1.dto.student.StudentStatusHistoryResponse;
import com.yo.day1.dto.student.StudentUpsertRequest;
import com.yo.day1.dto.student.StudentWithParentUpsertRequest;
import com.yo.day1.repository.*;
import com.yo.day1.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final ParentRepository parentRepository;
    private final StudentStatusHistoryRepository statusHistoryRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final LearningResultRepository learningResultRepository;
    private final TuitionInvoiceRepository tuitionInvoiceRepository;
    private final ModelMapper mapper;

    // ==================== TÌM KIẾM ====================

    @Transactional(readOnly = true)
    @Override
    public Page<StudentResponse> search(String search, StudentStatus status, String gradeLevel, Pageable pageable) {
        return studentRepository.findAll(
                StudentSpec.filter(search, status, gradeLevel),
                pageable)
                .map(s -> mapper.map(s, StudentResponse.class));
    }

    @Transactional(readOnly = true)
    @Override
    public List<StudentResponse> findByAll() {
        return studentRepository.findAll()
                .stream()
                .map(s -> mapper.map(s, StudentResponse.class))
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<StudentResponse> findById(long id) {
        return studentRepository.findById(id)
                .map(s -> mapper.map(s, StudentResponse.class));
    }

    // ==================== TẠO MỚI ====================

    @Transactional
    @Override
    public StudentResponse create(StudentUpsertRequest req) {
        if (req.getStudentCode() == null || req.getStudentCode().trim().isEmpty()) {
            throw new BadRequestException("Mã học sinh không được để trống");
        }
        if (req.getFullName() == null || req.getFullName().trim().isEmpty()) {
            throw new BadRequestException("Họ tên học sinh không được để trống");
        }
        if (req.getParentId() == null) {
            throw new BadRequestException("Phụ huynh không được để trống");
        }
        Parent parent = parentRepository.findById(req.getParentId())
                .orElseThrow(() -> new NotFoundExeception("Phụ huynh không tồn tại: " + req.getParentId()));

        if (studentRepository.existsByStudentCode(req.getStudentCode().trim())) {
            throw new ConflictException("Mã học sinh đã tồn tại: " + req.getStudentCode().trim());
        }

        Student stu = mapper.map(req, Student.class);
        stu.setStudentCode(req.getStudentCode().trim());
        stu.setFullName(req.getFullName().trim());
        stu.setParent(parent);
        return mapper.map(studentRepository.save(stu), StudentResponse.class);
    }

    // ==================== CẬP NHẬT ====================

    @Transactional
    @Override
    public StudentResponse update(Long id, StudentUpsertRequest req) {
        Student stu = studentRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Student not found: " + id));

        if (req.getStudentCode() == null || req.getStudentCode().trim().isEmpty()) {
            throw new BadRequestException("Mã học sinh không được để trống");
        }
        if (req.getFullName() == null || req.getFullName().trim().isEmpty()) {
            throw new BadRequestException("Họ tên học sinh không được để trống");
        }

        if (stu.getStudentCode() != null && !stu.getStudentCode().equalsIgnoreCase(req.getStudentCode().trim())
                && studentRepository.existsByStudentCode(req.getStudentCode().trim())) {
            throw new ConflictException("Mã học sinh đã tồn tại: " + req.getStudentCode().trim());
        }

        if (req.getParentId() != null) {
            Parent parent = parentRepository.findById(req.getParentId())
                    .orElseThrow(() -> new NotFoundExeception("Phụ huynh không tồn tại: " + req.getParentId()));
            stu.setParent(parent);
        }

        mapper.map(req, stu);
        stu.setStudentCode(req.getStudentCode().trim());
        stu.setFullName(req.getFullName().trim());
        return mapper.map(studentRepository.save(stu), StudentResponse.class);
    }

    // ==================== TẠO MỚI KÈM PHỤ HUYNH ====================

    @Transactional
    @Override
    public StudentResponse createWithParent(StudentWithParentUpsertRequest req) {
        if (req.getStudentCode() == null || req.getStudentCode().trim().isEmpty()) {
            throw new BadRequestException("Mã học sinh không được để trống");
        }
        if (req.getFullName() == null || req.getFullName().trim().isEmpty()) {
            throw new BadRequestException("Họ tên học sinh không được để trống");
        }
        if (req.getParentFullName() == null || req.getParentFullName().trim().isEmpty()) {
            throw new BadRequestException("Họ tên phụ huynh không được để trống");
        }

        if (studentRepository.existsByStudentCode(req.getStudentCode().trim())) {
            throw new ConflictException("Mã học sinh đã tồn tại: " + req.getStudentCode().trim());
        }

        Parent parent = new Parent();
        parent.setFullName(req.getParentFullName().trim());
        parent.setEmail(req.getParentEmail() != null && !req.getParentEmail().isBlank()
                ? req.getParentEmail().trim() : null);
        parent.setPhone(req.getParentPhone() != null ? req.getParentPhone().trim() : null);
        parent.setAddress(req.getParentAddress());
        parent.setGender(req.getParentGender());
        parent.setRelationship(req.getParentRelationship());
        parent = parentRepository.save(parent);

        Student stu = new Student();
        stu.setStudentCode(req.getStudentCode().trim());
        stu.setFullName(req.getFullName().trim());
        stu.setDateOfBirth(req.getDateOfBirth());
        stu.setGender(req.getGender());
        stu.setGradeLevel(req.getGradeLevel());
        stu.setSchoolName(req.getSchoolName());
        stu.setPhone(req.getPhone());
        stu.setDescription(req.getDescription());
        stu.setStatus(req.getStatus());
        stu.setLatestScore(req.getLatestScore());
        stu.setNote(req.getStudentNote());
        stu.setParent(parent);

        return mapper.map(studentRepository.save(stu), StudentResponse.class);
    }

    // ==================== CẬP NHẬT KÈM PHỤ HUYNH ====================

    @Transactional
    @Override
    public StudentResponse updateWithParent(Long id, StudentWithParentUpsertRequest req) {
        Student stu = studentRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Student not found: " + id));

        if (req.getStudentCode() == null || req.getStudentCode().trim().isEmpty()) {
            throw new BadRequestException("Mã học sinh không được để trống");
        }
        if (req.getFullName() == null || req.getFullName().trim().isEmpty()) {
            throw new BadRequestException("Họ tên học sinh không được để trống");
        }

        if (stu.getStudentCode() != null && !stu.getStudentCode().equalsIgnoreCase(req.getStudentCode().trim())
                && studentRepository.existsByStudentCode(req.getStudentCode().trim())) {
            throw new ConflictException("Mã học sinh đã tồn tại: " + req.getStudentCode().trim());
        }

        Parent parent = stu.getParent();
        if (parent == null) {
            parent = new Parent();
        }
        if (req.getParentFullName() != null && !req.getParentFullName().trim().isEmpty()) {
            parent.setFullName(req.getParentFullName().trim());
        }
        parent.setEmail(req.getParentEmail() != null && !req.getParentEmail().isBlank()
                ? req.getParentEmail().trim() : null);
        parent.setPhone(req.getParentPhone() != null ? req.getParentPhone().trim() : null);
        parent.setAddress(req.getParentAddress());
        parent.setGender(req.getParentGender());
        parent.setRelationship(req.getParentRelationship());
        parent = parentRepository.save(parent);

        stu.setStudentCode(req.getStudentCode().trim());
        stu.setFullName(req.getFullName().trim());
        stu.setDateOfBirth(req.getDateOfBirth());
        stu.setGender(req.getGender());
        stu.setGradeLevel(req.getGradeLevel());
        stu.setSchoolName(req.getSchoolName());
        stu.setPhone(req.getPhone());
        stu.setDescription(req.getDescription());
        stu.setStatus(req.getStatus());
        stu.setLatestScore(req.getLatestScore());
        stu.setNote(req.getStudentNote());
        stu.setParent(parent);

        return mapper.map(studentRepository.save(stu), StudentResponse.class);
    }

    // ==================== TÌM KIẾM NÂNG CAO ====================

    @Transactional(readOnly = true)
    @Override
    public Optional<StudentResponse> findByStudentCode(String studentCode) {
        return studentRepository.findByStudentCode(studentCode)
                .map(s -> mapper.map(s, StudentResponse.class));
    }

    @Transactional(readOnly = true)
    @Override
    public List<StudentResponse> findByStatus(StudentStatus status) {
        return studentRepository.findByStatus(status)
                .stream()
                .map(s -> mapper.map(s, StudentResponse.class))
                .toList();
    }

    // ==================== XÓA ====================

    @Transactional
    @Override
    public void deleteById(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new NotFoundExeception("Student not found: " + id);
        }
        if (enrollmentRepository != null && !enrollmentRepository.findByStudentId(id).isEmpty()) {
            throw new ConflictException("Không thể xóa học viên đã có lịch sử ghi danh lớp học.");
        }
        if (attendanceRepository != null && attendanceRepository.existsByStudentId(id)) {
            throw new ConflictException("Không thể xóa học viên đã có lịch sử điểm danh.");
        }
        if (learningResultRepository != null && !learningResultRepository.findByStudentId(id).isEmpty()) {
            throw new ConflictException("Không thể xóa học viên đã có bảng điểm học tập.");
        }
        if (tuitionInvoiceRepository != null && !tuitionInvoiceRepository.findByStudentId(id).isEmpty()) {
            throw new ConflictException("Không thể xóa học viên đã có hóa đơn học phí.");
        }
        studentRepository.deleteById(id);
    }

    @Override
    public List<StudentResponse> searchByName(String name) {
        return studentRepository
                .findByFullNameContainingIgnoreCase(name)       // Tìm tên có chứa chuỗi name, không phân biệt hoa thường
                .stream()
                .map(s -> mapper.map(s, StudentResponse.class))
                .toList();
    }

    // ==================== HỖ TRỢ NỘI BỘ ====================

    @Override
    public Student getStudent(Long id) {
        return studentRepository.findById(id)                   // Tìm Student theo id, trả về Entity (không phải DTO)
                .orElseThrow(() -> new NotFoundExeception("Student not found: " + id)); // Không thấy → ném exception
    }

    // ==================== DÀNH CHO PHỤ HUYNH ====================

    @Transactional(readOnly = true)
    @Override
    public Student getStudentForParent(Long studentId, Long parentId) {
        Student student = getStudent(studentId);                // Lấy Student theo id, không thấy → exception
        if (student.getParent() == null                         // Nếu Student không có Parent
                || !student.getParent().getId().equals(parentId)) { // Hoặc Parent không khớp với parentId đang đăng nhập
            throw new org.springframework.security.access.AccessDeniedException(
                    "Student does not belong to current parent account"); // → Từ chối truy cập (bảo mật)
        }
        return student;                                         // Parent hợp lệ → trả về Student
    }

    // ==================== ĐỔI TRẠNG THÁI ====================

    @Transactional
    @Override
    public StudentResponse changeStatus(Long id, ChangeStudentStatusRequest request, Long changedByUserId) {
        Student student = getStudent(id);                       // Lấy Student theo id
        StudentStatusHistory history = new StudentStatusHistory(); // Tạo bản ghi lịch sử mới
        history.setStudent(student);                            // Gắn Student vào lịch sử
        history.setOldStatus(student.getStatus());              // Lưu trạng thái cũ (trước khi đổi)
        history.setNewStatus(request.status());                 // Lưu trạng thái mới (sau khi đổi)
        history.setReason(request.reason());                    // Lưu lý do đổi trạng thái
        history.setChangedByUserId(changedByUserId);            // Lưu id của người thực hiện đổi
        statusHistoryRepository.save(history);                  // Lưu bản ghi lịch sử vào DB
        student.setStatus(request.status());                    // Cập nhật trạng thái mới cho Student
        return mapper.map(studentRepository.save(student), StudentResponse.class); // Lưu Student → trả về DTO
    }

    // ==================== XEM LỊCH SỬ TRẠNG THÁI ====================

    @Transactional(readOnly = true)
    @Override
    public List<StudentStatusHistoryResponse> getStatusHistory(Long studentId) {
        return statusHistoryRepository
                .findByStudentIdOrderByChangedAtDesc(studentId) // Lấy lịch sử của Student, sắp xếp mới nhất lên đầu
                .stream()
                .map(h -> new StudentStatusHistoryResponse(     // Convert từng bản ghi lịch sử → DTO
                        h.getId(),                              // id bản ghi
                        h.getOldStatus(),                       // Trạng thái cũ
                        h.getNewStatus(),                       // Trạng thái mới
                        h.getReason(),                          // Lý do đổi
                        h.getChangedByUserId(),                 // Id người đổi
                        h.getChangedAt()))                      // Thời điểm đổi
                .toList();
    }

    // ==================== TÌM THEO PHỤ HUYNH ====================

    @Transactional(readOnly = true)
    public List<StudentResponse> findByParentId(Long parentId) {
        return studentRepository.findByParentId(parentId)       // Lấy danh sách Student thuộc về 1 Parent
                .stream()
                .map(s -> mapper.map(s, StudentResponse.class))
                .toList();
    }
}