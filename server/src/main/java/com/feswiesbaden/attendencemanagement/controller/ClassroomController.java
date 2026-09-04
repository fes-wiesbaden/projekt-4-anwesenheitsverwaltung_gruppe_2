package com.feswiesbaden.attendencemanagement.controller;

import com.feswiesbaden.attendencemanagement.dto.requests.CreateClassroomDto;
import com.feswiesbaden.attendencemanagement.repository.ClassroomRepository;
import com.feswiesbaden.attendencemanagement.service.ClassroomService;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/classroom")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomRepository classroomRepository;

    private final ClassroomService classroomService;

    @PostMapping
    public ResponseEntity<String> CreateClassroom(@RequestBody CreateClassroomDto dto) {
        if (classroomRepository.existsByClassroomName(dto.classroomName))
            return ResponseEntity.status(HttpStatus.CONFLICT).build();

        return ResponseEntity.ok("Classroom Created!");
    }

    @GetMapping("/classrooms")
    public ResponseEntity<List<String>> getAllClassrooms(
            Authentication authentication) {

        return ResponseEntity.ok(
                classroomService.getAvailableClassrooms(
                        authentication.getName()));
    }

}
