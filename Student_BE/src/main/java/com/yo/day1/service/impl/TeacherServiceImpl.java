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

    @Override
    public TeacherResponse save(TeacherUpsertRequest req) {
        Teacher teacher = mapper.map(req, Teacher.class);
        return mapper.map(teacherRepository.save(teacher), TeacherResponse.class);
    }

    @Override
    public TeacherResponse update(Long id, TeacherUpsertRequest req) {
        Teacher existing = teacherRepository.findById(id)
                .orElseThrow(() -> new NotFoundExeception("Teacher not found: " + id));
        mapper.map(req, existing);
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
