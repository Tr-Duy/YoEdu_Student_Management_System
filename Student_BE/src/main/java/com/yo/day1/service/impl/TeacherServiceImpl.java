package com.yo.day1.service.impl;

import com.yo.day1.common.exception.ConflictException;
import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.Teacher;
import com.yo.day1.domain.enums.TeacherRole;
import com.yo.day1.domain.enums.TeacherStatus;
import com.yo.day1.domain.spec.TeacherSpec;
import com.yo.day1.dto.teacher.TeacherResponse;
import com.yo.day1.dto.teacher.TeacherUpsertRequest;
import com.yo.day1.repository.CourseClassRepository;
import com.yo.day1.repository.TeacherRepository;
import com.yo.day1.service.TeacherService;
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
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository teacherRepository;
    private final CourseClassRepository courseClassRepository;
    private final ModelMapper mapper;

    @Override
    public Page<TeacherResponse> search(String search, TeacherStatus status, TeacherRole role, Boolean isActive, Pageable pageable) {
        return teacherRepository.findAll(TeacherSpec.filter(search, status, role, isActive), pageable)
                .map(t -> mapper.map(t, TeacherResponse.class));
    }

    @Override
    public List<TeacherResponse> findAll(Boolean active) {
        List<Teacher> teachers = (active != null)
                ? teacherRepository.findByIsActive(active)
                : teacherRepository.findAll();
        return teachers.stream()
                .filter(t -> !Boolean.TRUE.equals(t.getDeleted()))
                .map(t -> mapper.map(t, TeacherResponse.class))
                .toList();
    }

    @Override
    public Optional<TeacherResponse> findById(Long id) {
        return teacherRepository.findById(id)
                .map(t -> mapper.map(t, TeacherResponse.class));
    }

    @Transactional
    @Override
    public TeacherResponse save(TeacherUpsertRequest req) {
        if (req.getTeacherCode() == null || req.getTeacherCode().trim().isEmpty()) {
            throw new com.yo.day1.common.exception.BadRequestException("Mã giáo viên không được để trống");
        }
        if (req.getFullName() == null || req.getFullName().trim().isEmpty()) {
            throw new com.yo.day1.common.exception.BadRequestException("Họ tên giáo viên không được để trống");
        }
        if (req.getPhone() == null || req.getPhone().trim().isEmpty()) {
            throw new com.yo.day1.common.exception.BadRequestException("Số điện thoại giáo viên không được để trống");
        }

        String code = req.getTeacherCode().trim();
        String phone = req.getPhone().trim();
        if (teacherRepository.existsByTeacherCode(code)) {
            throw new ConflictException("Mã giáo viên đã tồn tại: " + code);
        }
        if (teacherRepository.existsByPhone(phone)) {
            throw new ConflictException("Số điện thoại giáo viên đã tồn tại: " + phone);
        }

        Teacher teacher = mapper.map(req, Teacher.class);
        teacher.setTeacherCode(code);
        teacher.setFullName(req.getFullName().trim());
        teacher.setPhone(phone);
        return mapper.map(teacherRepository.save(teacher), TeacherResponse.class);
    }

    @Transactional
    @Override
    public TeacherResponse update(Long id, TeacherUpsertRequest req) {
        Teacher existing = teacherRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Teacher not found: " + id));

        if (req.getTeacherCode() == null || req.getTeacherCode().trim().isEmpty()) {
            throw new com.yo.day1.common.exception.BadRequestException("Mã giáo viên không được để trống");
        }
        if (req.getFullName() == null || req.getFullName().trim().isEmpty()) {
            throw new com.yo.day1.common.exception.BadRequestException("Họ tên giáo viên không được để trống");
        }
        if (req.getPhone() == null || req.getPhone().trim().isEmpty()) {
            throw new com.yo.day1.common.exception.BadRequestException("Số điện thoại giáo viên không được để trống");
        }

        String code = req.getTeacherCode().trim();
        String phone = req.getPhone().trim();

        if (existing.getTeacherCode() != null && !existing.getTeacherCode().equalsIgnoreCase(code)
                && teacherRepository.existsByTeacherCode(code)) {
            throw new ConflictException("Mã giáo viên đã tồn tại: " + code);
        }
        if (existing.getPhone() != null && !existing.getPhone().equalsIgnoreCase(phone)
                && teacherRepository.existsByPhone(phone)) {
            throw new ConflictException("Số điện thoại giáo viên đã tồn tại: " + phone);
        }

        mapper.map(req, existing);
        existing.setTeacherCode(code);
        existing.setFullName(req.getFullName().trim());
        existing.setPhone(phone);
        return mapper.map(teacherRepository.save(existing), TeacherResponse.class);
    }

    @Override
    public void delete(Long id) {
        if (!teacherRepository.existsById(id)) {
            throw new NotFoundExeception("Teacher not found: " + id);
        }
        if (courseClassRepository != null && courseClassRepository.hasActiveClassesForTeacher(id)) {
            throw new ConflictException("Không thể ngừng hoạt động giáo viên đang phụ trách lớp học đang mở hoặc đang diễn ra.");
        }
        teacherRepository.deleteById(id);
    }
}
