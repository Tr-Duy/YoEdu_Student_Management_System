package com.yo.day1.service.impl;

import com.yo.day1.domain.entity.Student;
import com.yo.day1.repository.StudentRepository;
import com.yo.day1.service.StudentService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentServiceImpl implements StudentService {
    private final StudentRepository studenRespository;
    public StudentServiceImpl(StudentRepository studenRespository) {
        this.studenRespository = studenRespository;
    }
    public List<Student> findByAll() {
        return studenRespository.findAll();
    }
}
