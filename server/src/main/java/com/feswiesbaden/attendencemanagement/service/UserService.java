package com.feswiesbaden.attendencemanagement.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.feswiesbaden.attendencemanagement.entity.Role;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User createUser(User user) {
        user.setPassword(
                passwordEncoder.encode(user.getPassword())
            );
        user.setRole(Role.USER);
            return userRepository.save(user);
    }
}
