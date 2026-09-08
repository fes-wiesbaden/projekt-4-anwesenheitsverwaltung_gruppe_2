package com.feswiesbaden.attendencemanagement.controller;

import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.feswiesbaden.attendencemanagement.entity.Student;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor 
public class StudentController {

    
    private final StudentRepository studentRepository;

   
    @GetMapping("/students")
    public ResponseEntity<List<Student>> GetAllStudents() {
        return ResponseEntity.ok(studentRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> GetStudent(@PathVariable UUID id) {
        return studentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("myStudents")
    public ResponseEntity<List<Student>> GetMyStudents(Authentication authentication){
        return ResponseEntity.ok(studentRepository.findStudentsByTeacherUsername(authentication.getName()));
    }





}
