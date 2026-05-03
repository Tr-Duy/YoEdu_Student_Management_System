package com.yo.day1.service.impl;

import com.yo.day1.domain.entity.Teacher;
import com.yo.day1.repository.TeacherRepository;
import com.yo.day1.service.TeacherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TeacherServiceImpl implements TeacherService {

    private final TeacherRepository teacherRepository;

    public List<Teacher> findAll() {
        return teacherRepository.findAll();
    }

    public Optional<Teacher> findById(Long id) {
        return teacherRepository.findById(id);
    }

    public Teacher save(Teacher teacher) {
        return teacherRepository.save(teacher);
    }

    public Teacher update(Long id, Teacher teacher) {
        Teacher existing = teacherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Teacher not found: " + id));
        existing.setFullName(teacher.getFullName());
        existing.setEmail(teacher.getEmail());
        existing.setPhone(teacher.getPhone());
        existing.setSpecialization(teacher.getSpecialization());
        existing.setIsActive(teacher.getIsActive());
        return teacherRepository.save(existing);
    }

    public void delete(Long id) {
        teacherRepository.deleteById(id);
    }
}
