package com.feswiesbaden.attendencemanagement.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

import com.feswiesbaden.attendencemanagement.dto.requests.RegisterDto;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.repository.ClassroomRepository;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;
    private final PasswordEncoder passwordEncoder;

    public User findUserByUsername(String username) {
        User user = userRepository.findByUsername(username);

        if (user == null) {
            throw new RuntimeException("User nicht gefunden");
        }

        return user;
    }

    public User addClassroom(User user, Classroom classroom) {
        if (classroom.getTeachers() == null) {
            classroom.setTeachers(new java.util.ArrayList<>());
        }
        boolean alreadyTeacher = classroom.getTeachers().stream()
                .anyMatch(t -> t.getId().equals(user.getId()));
        if (!alreadyTeacher) {
            classroom.getTeachers().add(user);
            classroomRepository.save(classroom);
        }
        return userRepository.save(user);
    }

    public User assignMyClassroom(User user, Classroom classroom) {
        user.setMyClassroom(classroom);
        return userRepository.save(user);
    }

    public boolean usernameExists(String username) {
        return userRepository.existsByUsername(username);
    }

    public List<User> getUsers() {
        return userRepository.findAll();
    }

    public User createUser(RegisterDto registerDto) {
        User user = new User();
        user.setUsername(registerDto.getUsername().trim());
        user.setDisplayName(registerDto.getDisplayName());
        user.setPassword(passwordEncoder.encode(registerDto.getPassword()));
        user.setRole(registerDto.getRole() == null
                ? com.feswiesbaden.attendencemanagement.entity.Role.TEACHER
                : registerDto.getRole());
        user.setFirstLogin(true);
        user.setCreatedAt(LocalDate.now());
        return userRepository.save(user);
    }
}
