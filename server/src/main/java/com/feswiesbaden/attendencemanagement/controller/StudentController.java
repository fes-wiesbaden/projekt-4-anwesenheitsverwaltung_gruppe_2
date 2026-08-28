package com.feswiesbaden.attendencemanagement.controller;

import com.feswiesbaden.attendencemanagement.dto.requests.CreateStudentRequestDto;
import com.feswiesbaden.attendencemanagement.dto.response.CreateStudentResponseDto;
import com.feswiesbaden.attendencemanagement.entity.Student;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @PostMapping("/create")
    public ResponseEntity<CreateStudentResponseDto> CreateStudent(@RequestBody CreateStudentRequestDto dto) {
        if (studentRepository.existsByUsername(dto.username)) return ResponseEntity.status(HttpStatus.CONFLICT).build();
        if (dto.username == null || dto.username.isBlank()) return ResponseEntity.badRequest().build();

        Student student = new Student();
        student.setUsername(dto.username);
        student.setDisplayName(dto.displayName);
        studentRepository.save(student);

        System.out.println("Saved Student with username: " + dto.username);
        return ResponseEntity.ok(new CreateStudentResponseDto(student.getId(), student.getUsername()));
    }

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

    @PutMapping("/{id}")
    public ResponseEntity<Student> EditStudent(@PathVariable UUID id, @Valid @RequestBody CreateStudentRequestDto dto){
        if (dto.username == null || dto.username.isBlank()) return ResponseEntity.badRequest().build();

        Optional<Student> existingOpt = studentRepository.findById(id);
        if(existingOpt.isEmpty()) return ResponseEntity.notFound().build();

        Student existing = existingOpt.get();

        if(!existing.getUsername().equals(dto.username)
            && studentRepository.existsByUsername(dto.username)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        existing.setUsername(dto.username);
        existing.setDisplayName(dto.displayName);
        studentRepository.save(existing);

        System.out.println("Updated User: " + dto.username);
        return ResponseEntity.ok(existing);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> DeleteStudent(@PathVariable UUID id) {
        if (!studentRepository.existsById(id)) return ResponseEntity.notFound().build();

        studentRepository.deleteById(id);
        System.out.println("Deleted Student with id: " + id);
        return ResponseEntity.noContent().build();
    }

}
