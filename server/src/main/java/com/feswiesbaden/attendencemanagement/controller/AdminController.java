package com.feswiesbaden.attendencemanagement.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.feswiesbaden.attendencemanagement.dto.requests.AssignClassDto;
import com.feswiesbaden.attendencemanagement.dto.requests.RegisterDto;
import com.feswiesbaden.attendencemanagement.dto.response.UserResponseDto;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.service.AdminService;
import com.feswiesbaden.attendencemanagement.service.ClassroomService;
import com.feswiesbaden.attendencemanagement.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
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
}
