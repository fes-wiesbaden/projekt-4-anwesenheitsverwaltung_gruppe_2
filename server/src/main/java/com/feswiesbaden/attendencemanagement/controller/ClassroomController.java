package com.feswiesbaden.attendencemanagement.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import com.feswiesbaden.attendencemanagement.dto.requests.CreateClassroomDto;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.Role;
import com.feswiesbaden.attendencemanagement.entity.Room;
import com.feswiesbaden.attendencemanagement.entity.Student;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.repository.ClassroomRepository;
import com.feswiesbaden.attendencemanagement.repository.RoomRepository;
import com.feswiesbaden.attendencemanagement.repository.StudentRepository;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;

import com.feswiesbaden.attendencemanagement.entity.Attendance;
import com.feswiesbaden.attendencemanagement.dto.response.AttendanceRecordResponseDto;
import com.feswiesbaden.attendencemanagement.service.ClassroomService;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/classroom")
@RequiredArgsConstructor

public class ClassroomController {

    private final RoomRepository roomRepository;

    private final ClassroomRepository classroomRepository;

    private final StudentRepository studentRepository;

    private final UserRepository userRepository;

    private final ClassroomService classroomService;

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName());
    }

    @PostMapping
    public ResponseEntity<String> CreateClassroom(@RequestBody CreateClassroomDto dto,
            Authentication authentication){
        User user = getCurrentUser(authentication);
        if (user == null || user.getRole() != Role.ADMIN) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        if (dto == null || dto.classroomName == null || dto.classroomName.isBlank() || dto.roomId == null) {
            return ResponseEntity.badRequest().build();
        }
        if (classroomRepository.existsByClassroomName(dto.classroomName.trim())) return ResponseEntity.status(HttpStatus.CONFLICT).build();

        Optional<Room> existingRoom = roomRepository.findById(dto.roomId);
        if(existingRoom.isEmpty()) return ResponseEntity.notFound().build();
        Room room = existingRoom.get();

        Classroom classroom = new Classroom();
        classroom.setClassroomName(dto.classroomName.trim());
        classroom.setRoom(room);

        classroomRepository.save(classroom);

        return ResponseEntity.ok("Classroom Created!");
    }

    // add students to classroom (owner or admin only)
    @PostMapping("/{studentId}/{classroomId}")
    public ResponseEntity<String> AddStudent(@PathVariable UUID studentId, @PathVariable Long classroomId,
            Authentication authentication){
        User user = getCurrentUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        if (!studentRepository.existsById(studentId)) return ResponseEntity.badRequest().build();
        if (!classroomRepository.existsById(classroomId)) return ResponseEntity.badRequest().build();

        Optional<Student> existingStudent = studentRepository.findById(studentId);
        if (existingStudent.isEmpty()) return ResponseEntity.notFound().build();

        Student student = existingStudent.get();
        if (user.getRole() != Role.ADMIN && student.getClassroom() != null
                && !student.getClassroom().getId().equals(classroomId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Classroom> existingClassroom = classroomRepository.findById(classroomId);
        if (existingClassroom.isEmpty()) return ResponseEntity.notFound().build();

        Classroom classroom = existingClassroom.get();

        if (!classroomService.hasAccess(user, classroom)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        student.setClassroom(classroom);
        studentRepository.save(student);
        return ResponseEntity.ok("Saved");
    }

    @GetMapping("/my")
    public ResponseEntity<Classroom> getMyClassroom(Authentication authentication) {
        User user = getCurrentUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (user.getMyClassroom() == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(user.getMyClassroom());
    }

    @GetMapping("/allClassrooms")
    public ResponseEntity<List<String>> getAllClassrooms(
            Authentication authentication) {

        User user = getCurrentUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (user.getRole() == Role.ADMIN) {
            return ResponseEntity.ok(classroomRepository.findAll().stream()
                    .map(Classroom::getClassroomName).toList());
        }
        return ResponseEntity.ok(classroomService.getAvailableClassrooms(authentication.getName()));
    }

    @GetMapping("/AttendanceDay")
    public ResponseEntity<List<AttendanceRecordResponseDto>> getAttendances(Authentication authentication,
            @RequestParam("classname") String Classname,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        User user = getCurrentUser(authentication);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Optional<Classroom> classroomOpt = classroomRepository.findByClassroomName(Classname);
        if (classroomOpt.isEmpty()) return ResponseEntity.notFound().build();
        if (!classroomService.hasAccess(user, classroomOpt.get())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(classroomService.getAttendances(Classname, date).stream()
                .map(AttendanceRecordResponseDto::new).toList());
    }
}
