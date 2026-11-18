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
import com.feswiesbaden.attendencemanagement.repository.UserRepository;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.entity.Role;
import com.feswiesbaden.attendencemanagement.service.ClassroomService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor 
public class StudentController {

    
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final ClassroomService classroomService;

   
    @GetMapping("/students")
    public ResponseEntity<List<Student>> GetAllStudents() {
        return ResponseEntity.ok(studentRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> GetStudent(@PathVariable UUID id, Authentication authentication) {
        User user = userRepository.findByUsername(authentication.getName());
        if (user == null) return ResponseEntity.status(401).build();
        Student student = studentRepository.findById(id).orElse(null);
        if (student == null) return ResponseEntity.notFound().build();
        if (user.getRole() != Role.ADMIN
                && (student.getClassroom() == null || !classroomService.hasAccess(user, student.getClassroom()))) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(student);
    }

    @GetMapping("myStudents")
    public ResponseEntity<List<Student>> GetMyStudents(Authentication authentication){
        User user = userRepository.findByUsername(authentication.getName());
        if (user == null) return ResponseEntity.status(401).build();
        if (user.getRole() == Role.ADMIN) return ResponseEntity.ok(studentRepository.findAll());
        return ResponseEntity.ok(studentRepository.findStudentsByTeacherUsername(authentication.getName()));
    }





}
