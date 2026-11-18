package com.feswiesbaden.attendencemanagement.controller;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
import com.feswiesbaden.attendencemanagement.entity.Role;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;
import com.feswiesbaden.attendencemanagement.repository.AttendanceRepository;
import com.feswiesbaden.attendencemanagement.service.AdminService;
import com.feswiesbaden.attendencemanagement.service.ClassroomService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import com.feswiesbaden.attendencemanagement.service.SystemAuditLogService;

@RestController
@RequestMapping("/api/auth/admin")
@RequiredArgsConstructor
public class AdminController {

    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final AdminService adminService;
    private final ClassroomService classroomService;
    private final SystemAuditLogService auditLogService;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDto>> getUsers() {
        return ResponseEntity.ok(adminService.getUsers().stream()
                .map(user -> new UserResponseDto(user.getId(), user.getDisplayName(), user.getUsername(),
                        user.getCreatedAt(), user.getRole()))
                .toList());
    }

    @PostMapping("/createUser")
    public ResponseEntity<UserResponseDto> createUser(@RequestBody RegisterDto registerDto) {
        if (registerDto == null || registerDto.getUsername() == null || registerDto.getUsername().isBlank()
                || registerDto.getPassword() == null || registerDto.getPassword().length() < 10) {
            return ResponseEntity.badRequest().build();
        }
        if (adminService.usernameExists(registerDto.getUsername().trim())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        User user = adminService.createUser(registerDto);
        UserResponseDto response = new UserResponseDto(
                user.getId(),
                user.getDisplayName(),
                user.getUsername(),
                user.getCreatedAt(),
                user.getRole());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/assign-class")
    public ResponseEntity<UserResponseDto> assignClass(@RequestBody AssignClassDto assignClassDto, Authentication auth) {
        if (assignClassDto == null || assignClassDto.getUsername() == null
                || assignClassDto.getClassroomId() <= 0) return ResponseEntity.badRequest().build();
        User user;
        Classroom classroom;
        try {
            user = adminService.findUserByUsername(assignClassDto.getUsername());
            classroom = classroomService.findById(assignClassDto.getClassroomId());
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        }
        if (user.getRole() != Role.TEACHER) return ResponseEntity.badRequest().build();
        user = adminService.addClassroom(user, classroom);
        auditLogService.record(auth.getName(), "TEACHER_CLASS_ASSIGNED", "USER", user.getId().toString(),
                "Assigned teacher to class " + classroom.getClassroomName(), null, classroom.getId().toString());

        UserResponseDto response = new UserResponseDto(
                user.getId(),
                user.getDisplayName(),
                user.getUsername(),
                user.getCreatedAt(),
                user.getRole());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/assignMyClassroom")
    public ResponseEntity<UserResponseDto> assignMyClassroom(@RequestBody AssignClassDto assignClassDto, Authentication auth) {
        if (assignClassDto == null || assignClassDto.getUsername() == null
                || assignClassDto.getClassroomId() <= 0) return ResponseEntity.badRequest().build();
        User user;
        Classroom classroom;
        try {
            user = adminService.findUserByUsername(assignClassDto.getUsername());
            classroom = classroomService.findById(assignClassDto.getClassroomId());
        } catch (RuntimeException ex) {
            return ResponseEntity.notFound().build();
        }
        if (user.getRole() != Role.TEACHER) return ResponseEntity.badRequest().build();
        try {
            user = adminService.assignMyClassroom(user, classroom);
            auditLogService.record(auth.getName(), "TEACHER_PRIMARY_CLASS_ASSIGNED", "USER", user.getId().toString(),
                    "Assigned primary class " + classroom.getClassroomName(), null, classroom.getId().toString());
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        UserResponseDto response = new UserResponseDto(
                user.getId(),
                user.getDisplayName(),
                user.getUsername(),
                user.getCreatedAt(),
                user.getRole());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/create")
    public ResponseEntity<CreateStudentResponseDto> CreateStudent(@RequestBody CreateStudentRequestDto dto, Authentication auth) {
        if (dto == null || dto.username == null || dto.username.isBlank())
            return ResponseEntity.badRequest().build();
        if (studentRepository.existsByUsername(dto.username.trim()))
            return ResponseEntity.status(HttpStatus.CONFLICT).build();

        Student student = new Student();
        student.setUsername(dto.username.trim());
        student.setDisplayName(dto.displayName);
        studentRepository.save(student);
        auditLogService.record(auth.getName(), "STUDENT_CREATED", "STUDENT", student.getId().toString(),
                "Created student " + student.getUsername(), null, student.getUsername() + "|" + student.getDisplayName());

        System.out.println("Saved Student with username: " + dto.username);
        return ResponseEntity.ok(new CreateStudentResponseDto(student.getId(), student.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> EditStudent(@PathVariable UUID id, @Valid @RequestBody CreateStudentRequestDto dto, Authentication auth) {
        if (dto == null || dto.username == null || dto.username.isBlank())
            return ResponseEntity.badRequest().build();

        Optional<Student> existingOpt = studentRepository.findById(id);
        if (existingOpt.isEmpty())
            return ResponseEntity.notFound().build();

        Student existing = existingOpt.get();

        String normalizedUsername = dto.username.trim();
        if (!existing.getUsername().equals(normalizedUsername)
                && studentRepository.existsByUsername(normalizedUsername)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        String before = existing.getUsername() + "|" + existing.getDisplayName();
        existing.setUsername(normalizedUsername);
        existing.setDisplayName(dto.displayName);
        studentRepository.save(existing);
        auditLogService.record(auth.getName(), "STUDENT_UPDATED", "STUDENT", existing.getId().toString(),
                "Updated student " + existing.getUsername(), before,
                existing.getUsername() + "|" + existing.getDisplayName());

        System.out.println("Updated User: " + dto.username);
        return ResponseEntity.ok(existing);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> DeleteStudent(@PathVariable UUID id, Authentication auth) {
        Student student = studentRepository.findById(id).orElse(null);
        if (student == null) return ResponseEntity.notFound().build();
        if (attendanceRepository.existsByStudent_Id(id)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        auditLogService.record(auth.getName(), "STUDENT_DELETED", "STUDENT", id.toString(),
                "Deleted student " + student.getUsername(), student.getUsername() + "|" + student.getDisplayName(), null);
        student.setRfidChip(null);
        studentRepository.save(student);
        studentRepository.delete(student);
        System.out.println("Deleted Student with id: " + id);
        return ResponseEntity.noContent().build();
    }

}
