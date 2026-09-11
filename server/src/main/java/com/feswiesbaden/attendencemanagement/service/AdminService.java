package com.feswiesbaden.attendencemanagement.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

    public User createUser(RegisterDto registerDto) {
        User user = new User();
        String defaultPassword = passwordEncoder.encode(generateDefaultPassword(12));
        user.setUsername(registerDto.getUsername());
        user.setDisplayName(registerDto.getDisplayname());
        user.setPassword(defaultPassword);
        user.setRole(registerDto.getRole());
        user.setFirstLogin(true);
       
        return userRepository.save(user);
    }

    public String generateDefaultPassword(int length) {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        StringBuilder password = new StringBuilder();

        for (int i = 0; i < length; i++) {
            int index = (int) (Math.random() * characters.length());
            password.append(characters.charAt(index));

            if ((i + 1) % 3 == 0 && i + 1 < length) {
                password.append("-");
            }
        }

    return password.toString();
    }
}
