package com.feswiesbaden.attendencemanagement.controller;

import com.feswiesbaden.attendencemanagement.dto.requests.CreateClassroomDto;
import com.feswiesbaden.attendencemanagement.repository.ClassroomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/classroom")
public class ClassroomController {

    @Autowired
    private ClassroomRepository classroomRepository;

    @PostMapping
    public ResponseEntity<String> CreateClassroom(@RequestBody CreateClassroomDto dto){
        if (classroomRepository.existsByClassroomName(dto.classroomName)) return ResponseEntity.status(HttpStatus.CONFLICT).build();


        return ResponseEntity.ok("Classroom Created!");
    }
}
