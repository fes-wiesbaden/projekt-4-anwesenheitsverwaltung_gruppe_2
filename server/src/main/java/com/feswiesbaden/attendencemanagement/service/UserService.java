package com.feswiesbaden.attendencemanagement.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.feswiesbaden.attendencemanagement.entity.Role;
import com.feswiesbaden.attendencemanagement.entity.User;
import com.feswiesbaden.attendencemanagement.repository.UserRepository;
import com.feswiesbaden.attendencemanagement.dto.requests.RegisterDto;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User createUser(RegisterDto registerDto) {
        User user = new User();

        user.setUsername(registerDto.getUsername());
        user.setDisplayName(registerDto.getDisplayname());
        user.setRole(registerDto.getRole());

        user.setPassword(
                passwordEncoder.encode(registerDto.getPassword()));

        return userRepository.save(user);
    }
}
