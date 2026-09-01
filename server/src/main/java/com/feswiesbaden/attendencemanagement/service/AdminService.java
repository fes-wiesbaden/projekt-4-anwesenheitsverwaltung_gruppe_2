package com.feswiesbaden.attendencemanagement.service;

import java.util.List;
import org.springframework.stereotype.Service;

import com.feswiesbaden.attendencemanagement.entity.Classroom;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;

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
}
