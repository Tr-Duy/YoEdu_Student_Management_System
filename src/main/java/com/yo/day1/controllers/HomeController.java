package com.yo.day1.controllers;

import com.yo.day1.domain.entity.Student;
import com.yo.day1.service.StudentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class HomeController {

        private final StudentService studentService;


    @GetMapping
    public ResponseEntity<String> home(){
        return ResponseEntity.ok("\"data\": \"this is my content\"");
    }
    @GetMapping(value = "/students")
    public ResponseEntity<List<Student>> findByAll(){
        return ResponseEntity.ok(studentService.findByAll());
    }
}
