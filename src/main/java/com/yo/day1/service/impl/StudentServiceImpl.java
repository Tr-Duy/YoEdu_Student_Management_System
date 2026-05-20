package com.yo.day1.service.impl;

import com.yo.day1.common.exception.NotFoundExeception;
import com.yo.day1.domain.entity.Student;
import com.yo.day1.domain.enums.StudentStatus;
import com.yo.day1.dto.student.StudentResponse;
import com.yo.day1.dto.student.StudentUpsertRequest;
import com.yo.day1.repository.ParentRepository;
import com.yo.day1.repository.StudentRepository;
import com.yo.day1.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final ParentRepository parentRepository;
    private final ModelMapper mapper;

    @Override
    public List<StudentResponse> findByAll() {
        return studentRepository.findAll()
                .stream()
                .map(s -> mapper.map(s, StudentResponse.class))
                .toList();
    }

    @Override
    public Optional<StudentResponse> findById(long id) {
        return studentRepository.findById(id)
                .map(s -> mapper.map(s, StudentResponse.class));
    }

    @Override
    public StudentResponse create(StudentUpsertRequest req) {
        Student stu = mapper.map(req, Student.class);
        parentRepository.findById(req.getParentId())
                .ifPresent(stu::setParent);
        return mapper.map(studentRepository.save(stu), StudentResponse.class);
    }

    @Override
    public StudentResponse update(Long id, StudentUpsertRequest req) {
        Student stu = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found: " + id));
        mapper.map(req, stu);
        parentRepository.findById(req.getParentId())
                .ifPresent(stu::setParent);
        return mapper.map(studentRepository.save(stu), StudentResponse.class);
    }

    @Override
    public Optional<StudentResponse> findByStudentCode(String studentCode) {
        return studentRepository.findByStudentCode(studentCode)
                .map(s -> mapper.map(s, StudentResponse.class));
    }

    @Override
    public List<StudentResponse> findByStatus(StudentStatus status) {
        return studentRepository.findByStatus(status)
                .stream()
                .map(s -> mapper.map(s, StudentResponse.class))
                .toList();
    }

    @Override
    public void deleteById(Long id) {
        if (studentRepository.existsById(id)) {
            studentRepository.deleteById(id);
        } else {
            throw new NotFoundExeception("not found id: " + id);
        }
    }

}
