package com.feswiesbaden.attendencemanagement.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.feswiesbaden.attendencemanagement.dto.requests.RegisterDto;
import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User findUserByUsername(String username) {
        User user = userRepository.findByUsername(username);

        if (user == null) {
            throw new RuntimeException("User nicht gefunden");
        }

        return user;
    }

    public User addClassroom(User user, Classroom classroom) {
        List<Classroom> classrooms = user.getClasses();
        if (!classrooms.contains(classroom)) {
            classrooms.add(classroom);
            user.setClasses(classrooms);
        }
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
