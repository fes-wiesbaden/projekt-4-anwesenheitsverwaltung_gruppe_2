package com.feswiesbaden.attendencemanagement.controller;

import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.feswiesbaden.attendencemanagement.dto.requests.AssignClassDto;
import com.feswiesbaden.attendencemanagement.dto.requests.CreateStudentRequestDto;
import com.feswiesbaden.attendencemanagement.dto.requests.RegisterDto;
import com.feswiesbaden.attendencemanagement.dto.response.CreateStudentResponseDto;
import com.feswiesbaden.attendencemanagement.dto.response.UserResponseDto;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.Student;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;
import com.feswiesbaden.attendencemanagement.service.AdminService;
import com.feswiesbaden.attendencemanagement.service.ClassroomService;
import com.feswiesbaden.attendencemanagement.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final StudentRepository studentRepository;
    private final AdminService adminService;
    private final ClassroomService classroomService;

    @PostMapping("/createUser")
    public ResponseEntity<UserResponseDto> createUser(@RequestBody RegisterDto registerDto) {
        User user = adminService.createUser(registerDto);
        UserResponseDto response = new UserResponseDto(
                user.getId(),
                user.getDisplayName(),
                user.getUsername(),
                user.getCreatedAt(),
                user.getRole());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<UserResponseDto> assignClass(@RequestBody AssignClassDto assignClassDto) {
        User user = adminService.findUserByUsername(assignClassDto.getUsername());
        Classroom classroom = classroomService.findById(assignClassDto.getClassroomId());
        user = adminService.addClassroom(user, classroom);

        UserResponseDto response = new UserResponseDto(
                user.getId(),
                user.getDisplayName(),
                user.getUsername(),
                user.getCreatedAt(),
                user.getRole());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/create")
    public ResponseEntity<CreateStudentResponseDto> CreateStudent(@RequestBody CreateStudentRequestDto dto) {
        if (studentRepository.existsByUsername(dto.username))
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        if (dto.username == null || dto.username.isBlank())
            return ResponseEntity.badRequest().build();

        Student student = new Student();
        student.setUsername(dto.username);
        student.setDisplayName(dto.displayName);
        studentRepository.save(student);

        System.out.println("Saved Student with username: " + dto.username);
        return ResponseEntity.ok(new CreateStudentResponseDto(student.getId(), student.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> EditStudent(@PathVariable UUID id, @Valid @RequestBody CreateStudentRequestDto dto) {
        if (dto.username == null || dto.username.isBlank())
            return ResponseEntity.badRequest().build();

        Optional<Student> existingOpt = studentRepository.findById(id);
        if (existingOpt.isEmpty())
            return ResponseEntity.notFound().build();

        Student existing = existingOpt.get();

        if (!existing.getUsername().equals(dto.username)
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
        if (!studentRepository.existsById(id))
            return ResponseEntity.notFound().build();

        studentRepository.deleteById(id);
        System.out.println("Deleted Student with id: " + id);
        return ResponseEntity.noContent().build();
    }

}
