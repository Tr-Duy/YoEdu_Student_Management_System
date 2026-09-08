package com.yo.day1.service.impl;

import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.Student;
import com.yo.day1.domain.entity.StudentStatusHistory;
import com.yo.day1.domain.enums.StudentStatus;
import com.yo.day1.domain.spec.StudentSpec;
import com.yo.day1.dto.student.ChangeStudentStatusRequest;
import com.yo.day1.dto.student.StudentResponse;
import com.yo.day1.dto.student.StudentStatusHistoryResponse;
import com.yo.day1.dto.student.StudentUpsertRequest;
import com.yo.day1.domain.entity.Parent;
import com.yo.day1.dto.student.StudentWithParentUpsertRequest;
import com.yo.day1.repository.ParentRepository;
import com.yo.day1.repository.StudentRepository;
import com.yo.day1.repository.StudentStatusHistoryRepository;
import com.yo.day1.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service                                    // Đánh dấu class này là tầng Service, Spring tự tạo và quản lý bean
@RequiredArgsConstructor                    // Lombok: tự tạo constructor chứa tất cả field final (thay cho @Autowired)
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;                   // Repository thao tác bảng students
    private final ParentRepository parentRepository;                     // Repository thao tác bảng parents
    private final StudentStatusHistoryRepository statusHistoryRepository;// Repository thao tác bảng lịch sử trạng thái
    private final ModelMapper mapper;                                    // Thư viện tự động convert Entity ↔ DTO

    // ==================== TÌM KIẾM ====================

    @Transactional(readOnly = true)         // Chỉ đọc DB, không ghi → Spring tối ưu hiệu năng
    @Override
    public Page<StudentResponse> search(String search, StudentStatus status, String gradeLevel, Pageable pageable) {
        return studentRepository.findAll(
                StudentSpec.filter(search, status, gradeLevel), // Tạo điều kiện WHERE động theo các tham số truyền vào
                pageable)                                        // Phân trang (page, size, sort)
                .map(s -> mapper.map(s, StudentResponse.class)); // Convert từng Student Entity → StudentResponse DTO
    }

    @Override
    public List<StudentResponse> findByAll() {
        return studentRepository.findAll()                       // Lấy toàn bộ danh sách Student từ DB
                .stream()                                        // Chuyển List thành Stream để xử lý tuần tự
                .map(s -> mapper.map(s, StudentResponse.class)) // Convert từng Student Entity → StudentResponse DTO
                .toList();                                       // Gom kết quả lại thành List
    }

    @Override
    public Optional<StudentResponse> findById(long id) {
        return studentRepository.findById(id)                   // Tìm Student theo id, trả về Optional (tránh NullPointerException)
                .map(s -> mapper.map(s, StudentResponse.class)); // Nếu tìm thấy → convert sang DTO, không thấy → trả Optional.empty()
    }

    // ==================== TẠO MỚI ====================

    @Override
    public StudentResponse create(StudentUpsertRequest req) {
        Student stu = mapper.map(req, Student.class);            // Convert DTO request → Student Entity
        parentRepository.findById(req.getParentId())            // Tìm Parent theo id trong request
                .ifPresent(stu::setParent);                      // Nếu tìm thấy Parent → gắn vào Student, không thấy → bỏ qua
        return mapper.map(studentRepository.save(stu), StudentResponse.class); // Lưu Student vào DB → convert kết quả sang DTO trả về
    }

    // ==================== CẬP NHẬT ====================

    @Override
    public StudentResponse update(Long id, StudentUpsertRequest req) {
        Student stu = studentRepository.findById(id)            // Tìm Student theo id
                .orElseThrow(() -> new RuntimeException("Student not found: " + id)); // Không tìm thấy → ném exception
        mapper.map(req, stu);                                    // Ghi đè các field từ request vào Student đang có (không tạo object mới)
        parentRepository.findById(req.getParentId())            // Tìm Parent mới theo id trong request
                .ifPresent(stu::setParent);                      // Nếu tìm thấy → cập nhật Parent cho Student
        return mapper.map(studentRepository.save(stu), StudentResponse.class); // Lưu Student đã cập nhật → trả về DTO
    }

    // ==================== TẠO MỚI KÈM PHỤ HUYNH ====================

    @Transactional                          // Nếu lỗi giữa chừng → rollback cả Parent lẫn Student, không lưu dở dang
    @Override
    public StudentResponse createWithParent(StudentWithParentUpsertRequest req) {
        Parent parent = new Parent();                            // Tạo object Parent mới
        parent.setFullName(req.getParentFullName());             // Set họ tên phụ huynh
        parent.setEmail(req.getParentEmail() != null
                && !req.getParentEmail().isBlank()
                ? req.getParentEmail() : null);                  // Nếu email không rỗng → lưu email, ngược lại → lưu null
        parent.setPhone(req.getParentPhone());                   // Set số điện thoại phụ huynh
        parent.setAddress(req.getParentAddress());               // Set địa chỉ phụ huynh
        parent.setGender(req.getParentGender());                 // Set giới tính phụ huynh
        parent.setRelationship(req.getParentRelationship());     // Set mối quan hệ với học sinh (cha/mẹ/ông/bà...)
        parent = parentRepository.save(parent);                  // Lưu Parent vào DB trước, lấy lại object có id

        Student stu = new Student();                             // Tạo object Student mới
        stu.setStudentCode(req.getStudentCode());                // Set mã học sinh
        stu.setFullName(req.getFullName());                      // Set họ tên học sinh
        stu.setDateOfBirth(req.getDateOfBirth());                // Set ngày sinh
        stu.setGender(req.getGender());                          // Set giới tính học sinh
        stu.setGradeLevel(req.getGradeLevel());                  // Set khối lớp
        stu.setSchoolName(req.getSchoolName());                  // Set tên trường
        stu.setPhone(req.getPhone());                            // Set số điện thoại học sinh
        stu.setDescription(req.getDescription());                // Set mô tả
        stu.setStatus(req.getStatus());                          // Set trạng thái học sinh
        stu.setLatestScore(req.getLatestScore());                // Set điểm gần nhất
        stu.setNote(req.getStudentNote());                       // Set ghi chú
        stu.setParent(parent);                                   // Gắn Parent vừa tạo vào Student

        return mapper.map(studentRepository.save(stu), StudentResponse.class); // Lưu Student → trả về DTO
    }

    // ==================== CẬP NHẬT KÈM PHỤ HUYNH ====================

    @Transactional                          // Rollback toàn bộ nếu có lỗi
    @Override
    public StudentResponse updateWithParent(Long id, StudentWithParentUpsertRequest req) {
        Student stu = studentRepository.findById(id)            // Tìm Student theo id
                .orElseThrow(() -> new NotFoundExeception("Student not found: " + id)); // Không tìm thấy → ném exception tùy chỉnh

        Parent parent = stu.getParent();                        // Lấy Parent hiện tại của Student
        if (parent == null) {                                   // Nếu Student chưa có Parent
            parent = new Parent();                              // → Tạo Parent mới
        }
        parent.setFullName(req.getParentFullName());            // Cập nhật họ tên phụ huynh
        parent.setEmail(req.getParentEmail() != null
                && !req.getParentEmail().isBlank()
                ? req.getParentEmail() : null);                 // Cập nhật email, rỗng thì lưu null
        parent.setPhone(req.getParentPhone());                  // Cập nhật số điện thoại
        parent.setAddress(req.getParentAddress());              // Cập nhật địa chỉ
        parent.setGender(req.getParentGender());                // Cập nhật giới tính
        parent.setRelationship(req.getParentRelationship());    // Cập nhật mối quan hệ
        parent = parentRepository.save(parent);                 // Lưu Parent đã cập nhật vào DB

        stu.setStudentCode(req.getStudentCode());               // Cập nhật mã học sinh
        stu.setFullName(req.getFullName());                     // Cập nhật họ tên
        stu.setDateOfBirth(req.getDateOfBirth());               // Cập nhật ngày sinh
        stu.setGender(req.getGender());                         // Cập nhật giới tính
        stu.setGradeLevel(req.getGradeLevel());                 // Cập nhật khối lớp
        stu.setSchoolName(req.getSchoolName());                 // Cập nhật tên trường
        stu.setPhone(req.getPhone());                           // Cập nhật số điện thoại
        stu.setDescription(req.getDescription());               // Cập nhật mô tả
        stu.setStatus(req.getStatus());                         // Cập nhật trạng thái
        stu.setLatestScore(req.getLatestScore());               // Cập nhật điểm gần nhất
        stu.setNote(req.getStudentNote());                      // Cập nhật ghi chú
        stu.setParent(parent);                                  // Gắn Parent đã cập nhật vào Student

        return mapper.map(studentRepository.save(stu), StudentResponse.class); // Lưu Student → trả về DTO
    }

    // ==================== TÌM KIẾM NÂNG CAO ====================

    @Override
    public Optional<StudentResponse> findByStudentCode(String studentCode) {
        return studentRepository.findByStudentCode(studentCode) // Tìm Student theo mã học sinh (VD: HS001)
                .map(s -> mapper.map(s, StudentResponse.class)); // Nếu thấy → convert sang DTO
    }

    @Override
    public List<StudentResponse> findByStatus(StudentStatus status) {
        return studentRepository.findByStatus(status)           // Lọc danh sách Student theo trạng thái
                .stream()
                .map(s -> mapper.map(s, StudentResponse.class))
                .toList();
    }

    // ==================== XÓA ====================

    @Override
    public void deleteById(Long id) {
        if (studentRepository.existsById(id)) {                 // Kiểm tra id có tồn tại trong DB không
            studentRepository.deleteById(id);                   // Tồn tại → xóa
        } else {
            throw new NotFoundExeception("not found id: " + id);// Không tồn tại → ném exception, không xóa ngầm
        }
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